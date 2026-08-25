const { sendResponse, handleError } = require("../utils/utils");
const catchAsyncError = require("../middleware/catchAsyncError");
const { listPermissions } = require("../services/roleService");

// Permission catalog (all available permission codes)
exports.listPermissions = catchAsyncError(async (req, res) => {
  try {
    const data = await listPermissions();
    sendResponse(res, 200, true, "Permissions fetched successfully", data, false);
  } catch (error) {
    handleError(res, error);
  }
});
