const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export class SystemSettingContractError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "SystemSettingContractError";
    this.field = field;
  }
}

const fail = (message, field) => {
  throw new SystemSettingContractError(message, field);
};

const parseNullableMetadata = (item, key) => {
  const { updatedAt, updatedById } = item;
  if ((updatedAt === null) !== (updatedById === null)) {
    fail(`${key} returned inconsistent update metadata.`, "updatedAt");
  }
  if (updatedAt !== null && Number.isNaN(Date.parse(updatedAt))) {
    fail(`${key}.updatedAt must be an ISO date.`, "updatedAt");
  }
  if (updatedById !== null && !UUID_PATTERN.test(updatedById)) {
    fail(`${key}.updatedById must be a UUID.`, "updatedById");
  }
};

const parseSchema = (schema, key) => {
  if (!isObject(schema)) fail(`${key}.valueSchema must be an object.`, "valueSchema");
  if (schema.type !== "object") {
    return { supported: false, reason: `Schema type “${String(schema.type)}” is not supported.` };
  }
  if (!Array.isArray(schema.fields)) {
    fail(`${key}.valueSchema.fields must be an array.`, "valueSchema.fields");
  }

  const names = new Set();
  const fields = schema.fields.map((field, index) => {
    if (!isObject(field)) fail(`${key} field ${index + 1} must be an object.`, "valueSchema.fields");
    if (typeof field.name !== "string" || !field.name.trim()) {
      fail(`${key} field ${index + 1} requires a name.`, "valueSchema.fields");
    }
    if (names.has(field.name)) fail(`${key} contains duplicate field ${field.name}.`, field.name);
    names.add(field.name);

    if (field.type !== "integer" && field.type !== "string") {
      return { ...field, supported: false };
    }
    if (field.type === "integer") {
      for (const constraint of ["min", "max"]) {
        if (
          field[constraint] !== undefined &&
          (!Number.isSafeInteger(field[constraint]))
        ) {
          fail(`${key}.${field.name}.${constraint} must be a safe integer.`, field.name);
        }
      }
      if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
        fail(`${key}.${field.name} has an invalid range.`, field.name);
      }
    }
    if (
      field.type === "string" &&
      field.maxLength !== undefined &&
      (!Number.isSafeInteger(field.maxLength) || field.maxLength < 0)
    ) {
      fail(`${key}.${field.name}.maxLength must be a non-negative integer.`, field.name);
    }
    return { ...field, supported: true };
  });

  const unsupported = fields.find((field) => !field.supported);
  if (unsupported) {
    return {
      supported: false,
      reason: `Field type “${String(unsupported.type)}” is not supported.`,
      fields,
    };
  }
  return { supported: true, fields };
};

const validateStoredValue = (value, schema) => {
  if (!schema.supported) return { valid: false, reason: schema.reason };
  if (!isObject(value)) return { valid: false, reason: "Stored value does not match the declared object schema." };

  for (const field of schema.fields) {
    const fieldValue = value[field.name];
    if (field.type === "integer") {
      if (!Number.isSafeInteger(fieldValue)) {
        return { valid: false, reason: `${field.name} is not a safe integer.` };
      }
      if (field.min !== undefined && fieldValue < field.min) {
        return { valid: false, reason: `${field.name} is below the declared minimum.` };
      }
      if (field.max !== undefined && fieldValue > field.max) {
        return { valid: false, reason: `${field.name} exceeds the declared maximum.` };
      }
    } else if (typeof fieldValue !== "string") {
      return { valid: false, reason: `${field.name} is not a string.` };
    } else if (field.maxLength !== undefined && fieldValue.length > field.maxLength) {
      return { valid: false, reason: `${field.name} exceeds the declared maximum length.` };
    }
  }
  return { valid: true, reason: null };
};

export function parseSystemSettingItem(item) {
  if (!isObject(item)) fail("System setting item must be an object.");
  if (typeof item.key !== "string" || !item.key.trim()) fail("System setting key is required.", "key");
  if (item.value !== null && !isObject(item.value)) fail(`${item.key}.value must be an object or null.`, "value");
  if (typeof item.description !== "string") fail(`${item.key}.description must be a string.`, "description");
  if (item.updatedAt !== null && typeof item.updatedAt !== "string") fail(`${item.key}.updatedAt is invalid.`, "updatedAt");
  if (item.updatedById !== null && typeof item.updatedById !== "string") fail(`${item.key}.updatedById is invalid.`, "updatedById");
  parseNullableMetadata(item, item.key);

  const schema = parseSchema(item.valueSchema, item.key);
  const valueState = validateStoredValue(item.value, schema);
  return {
    key: item.key,
    value: item.value,
    description: item.description,
    valueSchema: item.valueSchema,
    updatedAt: item.updatedAt,
    updatedById: item.updatedById,
    schema,
    valueState,
    editable: schema.supported && valueState.valid,
  };
}

const unwrap = (payload) => payload?.data?.data ?? payload?.data ?? payload;

export function parseSystemSettingListResponse(payload) {
  const data = unwrap(payload);
  if (!isObject(data) || !Array.isArray(data.items)) {
    fail("System settings response must contain an items array.", "items");
  }
  const items = data.items.map(parseSystemSettingItem);
  const keys = new Set();
  for (const item of items) {
    if (keys.has(item.key)) fail(`System settings response contains duplicate key ${item.key}.`, "key");
    keys.add(item.key);
  }
  return items;
}

export function parseSystemSettingUpdateResponse(payload) {
  return parseSystemSettingItem(unwrap(payload));
}
