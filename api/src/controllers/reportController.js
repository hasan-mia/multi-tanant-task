const catchAsyncError = require("../middleware/catchAsyncError");
const { sendResponse, handleError } = require("../utils/utils");
const { parsePagination } = require("../utils/pagination");
const reportService = require("../services/reportService");

exports.getUtilization = catchAsyncError(async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await reportService.getUtilization({
      orgId: req.user.orgId,
      page,
      limit,
    });
    sendResponse(
      res,
      200,
      true,
      "Utilization report fetched successfully",
      result,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});
