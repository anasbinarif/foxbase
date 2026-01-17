"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = exports.ValidationError = void 0;
class ValidationError extends Error {
    name = 'ValidationError';
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    name = 'NotFoundError';
}
exports.NotFoundError = NotFoundError;
