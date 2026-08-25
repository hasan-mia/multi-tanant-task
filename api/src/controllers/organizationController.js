const catchAsyncError = require("../middleware/catchAsyncError");
const { sendResponse, handleError } = require("../utils/utils");
const organizationService = require("../services/organizationService");

exports.createOrganization = catchAsyncError(async (req, res) => {
  try {
    const org = await organizationService.createOrganization({
      name: req.body.name,
    });
    sendResponse(
      res,
      201,
      true,
      "Organization created successfully",
      org,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

exports.listOrganizations = catchAsyncError(async (req, res) => {
  try {
    const orgs = await organizationService.listOrganizations();
    sendResponse(
      res,
      200,
      true,
      "Organizations fetched successfully",
      orgs,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

exports.getOrganization = catchAsyncError(async (req, res) => {
  try {
    const org = await organizationService.getOrganization(req.params.id);
    sendResponse(
      res,
      200,
      true,
      "Organization fetched successfully",
      org,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

exports.updateOrganization = catchAsyncError(async (req, res) => {
  try {
    const org = await organizationService.updateOrganization(req.params.id, {
      name: req.body.name,
    });
    sendResponse(
      res,
      200,
      true,
      "Organization updated successfully",
      org,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});

exports.deleteOrganization = catchAsyncError(async (req, res) => {
  try {
    const result = await organizationService.deleteOrganization(req.params.id);
    sendResponse(
      res,
      200,
      true,
      "Organization deleted successfully",
      result,
      true
    );
  } catch (error) {
    handleError(res, error);
  }
});
