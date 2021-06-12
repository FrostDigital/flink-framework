import express = require("express");

declare global {
  namespace Express {
    // Extends express Request type
    interface Request {
      reqId: string;
    }
  }
}
