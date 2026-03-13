// Standardized response utilities
export const successResponse = (data, message = 'Success', meta = {}) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
};

export const errorResponse = (message, statusCode = 500, details = {}) => {
  return {
    success: false,
    error: {
      message,
      ...details,
    },
    timestamp: new Date().toISOString(),
  };
};

export const paginatedResponse = (data, pagination, message = 'Success') => {
  return {
    success: true,
    data,
    message,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1,
    },
    timestamp: new Date().toISOString(),
  };
};

export const createdResponse = (data, message = 'Resource created successfully') => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
};

export const updatedResponse = (data, message = 'Resource updated successfully') => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
};

export const deletedResponse = (message = 'Resource deleted successfully') => {
  return {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};
