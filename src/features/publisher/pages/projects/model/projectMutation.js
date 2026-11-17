export class ProjectMutationValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProjectMutationValidationError";
  }
}

export const buildProjectUpdateInput = ({ name, description }) => {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (!normalizedName) {
    throw new ProjectMutationValidationError("Project name is required.");
  }
  if (normalizedName.length > 255) {
    throw new ProjectMutationValidationError("Project name must be 255 characters or fewer.");
  }

  const normalizedDescription =
    typeof description === "string" ? description.trim() : "";
  if (normalizedDescription.length > 4000) {
    throw new ProjectMutationValidationError(
      "Project description must be 4,000 characters or fewer.",
    );
  }

  return {
    name: normalizedName,
    description: normalizedDescription || null,
  };
};
