import { v4 as uuidv4 } from "uuid";

export const generateId = (prefix = "drawing") =>
  `${prefix}-${Date.now()}-${uuidv4()}`;
