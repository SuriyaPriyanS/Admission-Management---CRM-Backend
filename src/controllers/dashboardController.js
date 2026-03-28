import { Admission } from "../models/Admission.js";
import { Applicant } from "../models/Applicant.js";
import { Program } from "../models/Program.js";
import { SeatQuota } from "../models/SeatQuota.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const [
    intakeAgg,
    admittedCount,
    quotaStats,
    pendingDocuments,
    feePendingList,
    latestApplicants,
    latestAdmissions,
  ] = await Promise.all([
    Program.aggregate([
      {
        $group: {
          _id: null,
          totalIntake: { $sum: "$totalIntake" },
        },
      },
    ]),
    Admission.countDocuments({ status: "CONFIRMED" }),
    SeatQuota.aggregate([
      { $match: { isSupernumerary: false } },
      {
        $group: {
          _id: "$quotaType",
          seats: { $sum: "$seats" },
          filled: { $sum: "$filled" },
        },
      },
      {
        $project: {
          quotaType: "$_id",
          _id: 0,
          seats: 1,
          filled: 1,
          remaining: { $subtract: ["$seats", "$filled"] },
        },
      },
    ]),
    Applicant.find({ documentsStatus: { $ne: "VERIFIED" } })
      .select("applicationNo fullName documentsStatus")
      .limit(20)
      .sort({ createdAt: -1 }),
    Admission.find({ feeStatus: "PENDING" })
      .populate("applicantId", "applicationNo fullName")
      .populate("programId", "name code")
      .sort({ createdAt: -1 })
      .limit(20),
    Applicant.find()
      .select("fullName createdAt")
      .sort({ createdAt: -1 })
      .limit(5),
    Admission.find()
      .select("status feeStatus createdAt")
      .populate("applicantId", "fullName")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const totalIntake = intakeAgg?.[0]?.totalIntake || 0;
  const totalFilled = quotaStats.reduce((sum, quota) => sum + quota.filled, 0);
  const remainingSeats = quotaStats.reduce((sum, quota) => sum + quota.remaining, 0);

  const recentActivity = [
    ...latestApplicants.map((item) => ({
      message: `Applicant created: ${item.fullName}`,
      createdAt: item.createdAt,
      type: "APPLICANT",
    })),
    ...latestAdmissions.map((item) => ({
      message: `Admission ${item.status.toLowerCase()}: ${item?.applicantId?.fullName || "Unknown"}`,
      createdAt: item.createdAt,
      type: "ADMISSION",
    })),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  return res.json({
    success: true,
    data: {
      totals: {
        totalIntake,
        admitted: admittedCount,
        allocated: totalFilled,
        remainingSeats,
      },
      quotaWiseFilled: quotaStats,
      pendingDocuments,
      feePendingList,
      recentActivity,
    },
  });
});
