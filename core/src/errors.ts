export interface ErrorLike extends NodeJS.ErrnoException {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export class FileSystemError extends Error {
  [key: string]: any; // eslint-disable-line

  constructor(params: ErrorParams) {
    super(params.message);
    for (const [key, value] of Object.entries(params)) {
      this[key] = value; // eslint-disable-line
    }
  }

  public override toString() {
    return JSON.stringify(this, null, 2);
  }
}

/* Use RangeError instead. */
export const IndexSizeError: ErrorLike = {
  code: "1",
  name: "IndexSizeError",
  message: "The index is not in the allowed range.",
};

export const HierarchyRequestError: ErrorLike = {
  code: "3",
  name: "HierarchyRequestError",
  message: "The operation would yield an incorrect node tree. [DOM]",
};

export const WrongDocumentError: ErrorLike = {
  code: "4",
  name: "WrongDocumentError",
  message: "The object is in the wrong document. [DOM]",
};

export const InvalidCharacterError: ErrorLike = {
  code: "5",
  name: "InvalidCharacterError",
  message: "The string contains invalid characters.",
};

export const NoModificationAllowedError: ErrorLike = {
  code: "7",
  name: "NoModificationAllowedError",
  message: "The string contains invalid characters.",
};

export const NotFoundError: ErrorLike = {
  code: "8",
  name: "NotFoundError",
  message: "The object can not be found here.",
};

export const NotSupportedError: ErrorLike = {
  code: "9",
  name: "NotSupportedError",
  message: "The operation is not supported.",
};

export const InUseAttributeError: ErrorLike = {
  code: "10",
  name: "InUseAttributeError",
  message: "The attribute is in use.",
};

export const InvalidStateError: ErrorLike = {
  code: "11",
  name: "InvalidStateError",
  message: "The object is in an invalid state.",
};

export const SyntaxError: ErrorLike = {
  code: "12",
  name: "SyntaxError",
  message: "The string did not match the expected pattern.",
};

export const InvalidModificationError: ErrorLike = {
  code: "13",
  name: "InvalidModificationError",
  message: "The object can not be modified in this way.",
};

export const NamespaceError: ErrorLike = {
  code: "14",
  name: "NamespaceError",
  message: "The operation is not allowed by Namespaces in XML. [XML-NAMES]",
};

/* Use TypeError for invalid arguments, "NotSupportedError" DOMException for unsupported operations, and "NotAllowedError" DOMException for denied requests instead. */
export const InvalidAccessError: ErrorLike = {
  code: "15",
  name: "InvalidAccessError",
  message: "The object does not support the operation or argument.",
};

/* Use TypeError instead. */
export const TypeMismatchError: ErrorLike = {
  code: "17",
  name: "TypeMismatchError",
  message: "The type of the object does not match the expected type.",
};

export const SecurityError: ErrorLike = {
  code: "18",
  name: "SecurityError",
  message: "The operation is insecure.",
};

export const NetworkError: ErrorLike = {
  code: "19",
  name: "NetworkError",
  message: "A network error occurred.",
};

export const AbortError: ErrorLike = {
  code: "20",
  name: "AbortError",
  message: "The operation was aborted.",
};

export const URLMismatchError: ErrorLike = {
  code: "21",
  name: "URLMismatchError",
  message: "The given URL does not match another URL.",
};

export const QuotaExceededError: ErrorLike = {
  code: "22",
  name: "QuotaExceededError",
  message: "The quota has been exceeded.",
};

export const TimeoutError: ErrorLike = {
  code: "23",
  name: "TimeoutError",
  message: "The operation timed out.",
};

export const InvalidNodeTypeError: ErrorLike = {
  code: "24",
  name: "InvalidNodeTypeError",
  message:
    "The supplied node is incorrect or has an incorrect ancestor for this operation.",
};

export const DataCloneError: ErrorLike = {
  code: "25",
  name: "DataCloneError",
  message: "The object can not be cloned.",
};

export const EncodingError: ErrorLike = {
  name: "EncodingError",
  message: "The encoding operation (either encoded or decoding) failed.",
};

export const NotReadableError: ErrorLike = {
  name: "NotReadableError",
  message: "The I/O read operation failed.",
};

export const UnknownError: ErrorLike = {
  name: "UnknownError",
  message: "The operation failed for an unknown transient reason.",
};

export const ConstraintError: ErrorLike = {
  name: "ConstraintError",
  message:
    "A mutation operation in a transaction failed because a constraint was not satisfied.",
};

export const DataError: ErrorLike = {
  name: "DataError",
  message: "Provided data is inadequate.",
};

export const TransactionInactiveError: ErrorLike = {
  name: "TransactionInactiveError",
  message:
    "A request was placed against a transaction which is currently not active, or which is finished.",
};

export const ReadOnlyError: ErrorLike = {
  name: "ReadOnlyError",
  message: 'The mutating operation was attempted in a "readonly" transaction.',
};

export const VersionError: ErrorLike = {
  name: "VersionError",
  message:
    "An attempt was made to open a database using a lower version than the existing version.",
};

export const OperationError: ErrorLike = {
  name: "OperationError",
  message: "The operation failed for an operation-specific reason.",
};

export const NotAllowedError: ErrorLike = {
  name: "NotAllowedError",
  message:
    "The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.",
};

export const PathExistError: ErrorLike = {
  code: "12",
  name: "PathExistError",
  message: "The request file or directry has already existed.",
};

export const domExceptions: ErrorLike[] = [
  IndexSizeError,
  HierarchyRequestError,
  WrongDocumentError,
  InvalidCharacterError,
  NoModificationAllowedError,
  NotFoundError,
  NotSupportedError,
  InUseAttributeError,
  InvalidStateError,
  SyntaxError,
  InvalidModificationError,
  NamespaceError,
  InvalidAccessError,
  TypeMismatchError,
  SecurityError,
  NetworkError,
  AbortError,
  URLMismatchError,
  QuotaExceededError,
  TimeoutError,
  InvalidNodeTypeError,
  DataCloneError,
  EncodingError,
  NotReadableError,
  UnknownError,
  ConstraintError,
  DataError,
  TransactionInactiveError,
  ReadOnlyError,
  VersionError,
  OperationError,
  NotAllowedError,
];

export interface ErrorParams extends ErrorLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  e?: any;
  repository?: string;
  path?: string;
}

export function createError(error: ErrorParams): FileSystemError {
  if (isFileSystemError(error.e)) {
    return error.e;
  }

  /* eslint-disable */
  let found = false;
  const e = error.e;
  if (e?.name) {
    for (const de of domExceptions) {
      if (de.name === e.name) {
        found = true;
        error.name = de.name;
        error.code = de.code;
        if (!error.message) {
          error.message = de.message;
        }
        break;
      }
    }
  }
  if (!found) {
    for (const de of domExceptions) {
      if (de.name === error.name) {
        error.name = de.name;
        error.code = de.code;
        if (!error.message) {
          error.message = de.message;
        }
        break;
      }
    }
  }
  if (!error.name) {
    error.name = UnknownError.name;
    error.message = UnknownError.message;
  }
  /* eslint-enable */

  return new FileSystemError(error);
}

export function isFileSystemError(e?: unknown): e is FileSystemError {
  return e instanceof FileSystemError;
}
