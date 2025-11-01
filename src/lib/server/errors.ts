
/**
 * カスタムエラークラス
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "認証が必要です") {
    super(401, message);
  }
}
