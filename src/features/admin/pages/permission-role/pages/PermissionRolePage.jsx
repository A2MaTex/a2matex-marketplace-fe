import { useState, useEffect, useMemo } from "react";
import {
  MdShield,
  MdAdd,
  MdSave,
  MdSearch,
  MdSelectAll,
  MdEdit,
  MdContentCopy,
  MdDelete,
  MdCheckCircle,
  MdError,
  MdFilterList,
  MdCode,
  MdClose,
  MdKeyboardArrowDown,
  MdKeyboardArrowRight,
} from "react-icons/md";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { BsCheckCircleFill } from "react-icons/bs";
import styles from "./PermissionRolePage.module.css";
import { permissionRoleApi } from "../api/permissionRoleApi";

const HTTP_METHODS = [
  "ALL",
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
];

const EMPTY_PERMISSION = {
  name: "",
  description: "",
  module: "",
  path: "",
  method: "GET",
  scope: "",
};

function getModules(permissions) {
  return [...new Set(permissions.map((p) => p.module))].sort((a, b) =>
    a.localeCompare(b),
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PermissionRolePage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [draftIds, setDraftIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [roleSearch, setRoleSearch] = useState("");
  const [permFilter, setPermFilter] = useState("");
  const [activeMethod, setActiveMethod] = useState("ALL");
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [expandedModules, setExpandedModules] = useState(new Set());

  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [newPermission, setNewPermission] = useState(EMPTY_PERMISSION);
  const [lockedPermissionModule, setLockedPermissionModule] = useState(false);
  const [creatingPermission, setCreatingPermission] = useState(false);
  const [editingPermissionId, setEditingPermissionId] = useState(null);
  const [permissionEdit, setPermissionEdit] = useState({
    name: "",
    description: "",
  });
  const [updatingPermission, setUpdatingPermission] = useState(false);
  const [deletingPermissionId, setDeletingPermissionId] = useState(null);

  const fetchInitialData = async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        permissionRoleApi.getAllRoles(),
        permissionRoleApi.getAllPermissions(),
      ]);

      setRoles(rolesData);
      setPermissions(permsData);

      if (rolesData.length > 0) {
        setSelectedRoleId(rolesData[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    setPermFilter("");
    setActiveMethod("ALL");
    setShowAssignedOnly(false);
    try {
      const ids = await permissionRoleApi.getRolePermissions(selectedRoleId);

      setAssignedIds(new Set(ids));
      setDraftIds(new Set(ids));
    } catch (error) {
      console.error(error);
    }
  };

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId],
  );

  const modules = useMemo(() => getModules(permissions), [permissions]);

  const filteredPerms = useMemo(
    () =>
      permissions.filter((p) => {
        if (activeMethod !== "ALL" && p.method !== activeMethod) return false;
        if (permFilter) {
          const q = permFilter.toLowerCase();
          if (
            !p.name.toLowerCase().includes(q) &&
            !p.path.toLowerCase().includes(q) &&
            !p.description.toLowerCase().includes(q) &&
            !p.module.toLowerCase().includes(q) &&
            !p.method.toLowerCase().includes(q)
          )
            return false;
        }
        if (showAssignedOnly && !draftIds.has(p.id)) return false;
        return true;
      }),
    [permissions, activeMethod, permFilter, showAssignedOnly, draftIds],
  );

  const permissionsByModule = useMemo(() => {
    const allByModule = new Map(modules.map((module) => [module, []]));
    const visibleByModule = new Map(modules.map((module) => [module, []]));

    permissions.forEach((permission) => {
      allByModule.get(permission.module)?.push(permission);
    });
    filteredPerms.forEach((permission) => {
      visibleByModule.get(permission.module)?.push(permission);
    });

    return modules
      .map((module) => [
        module,
        {
          all: allByModule.get(module),
          visible: visibleByModule.get(module),
        },
      ])
      .filter(([, modulePermissions]) => modulePermissions.visible.length > 0);
  }, [filteredPerms, modules, permissions]);

  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (r) =>
          !roleSearch ||
          r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
          r.description?.toLowerCase().includes(roleSearch.toLowerCase()),
      ),
    [roles, roleSearch],
  );

  const isDirty = useMemo(() => {
    if (draftIds.size !== assignedIds.size) return true;
    for (const id of draftIds) if (!assignedIds.has(id)) return true;
    return false;
  }, [draftIds, assignedIds]);

  const togglePermission = (id) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const grantModulePermissions = (modulePermissions) =>
    setDraftIds((prev) => {
      const next = new Set(prev);
      modulePermissions.forEach((permission) => next.add(permission.id));
      return next;
    });

  const revokeModulePermissions = (modulePermissions) =>
    setDraftIds((prev) => {
      const next = new Set(prev);
      modulePermissions.forEach((permission) => next.delete(permission.id));
      return next;
    });

  const toggleModule = (module) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  };

  const handleSave = async ({ agreeRevokeAll = false }) => {
    if (draftIds.size === 0 && !agreeRevokeAll) {
      setShowRevokeConfirm(true);
      return;
    }
    if (!selectedRoleId || !isDirty) return;
    setSaving(true);
    try {
      await permissionRoleApi.saveRolePermissions(selectedRoleId, [
        ...draftIds,
      ]);
      setAssignedIds(new Set(draftIds));
      setRoles((prev) =>
        prev.map((r) =>
          r.id === selectedRoleId
            ? { ...r, permissionCount: draftIds.size }
            : r,
        ),
      );
      showToast("success", "Changes saved successfully.");
    } catch {
      showToast("error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) return;
    setCreating(true);
    try {
      const createdId = await permissionRoleApi.createRole(newRole);
      setRoles((prev) => [...prev, { id: createdId, ...newRole }]);
      showToast("success", `Role "${newRole.name}" created.`);
    } catch {
      showToast("error", `Failed to create role. Please try again.`);
    } finally {
      setCreating(false);
      setShowCreateModal(false);
      setNewRole({ name: "", description: "" });
    }
  };

  const openPermissionModal = (module = "") => {
    setNewPermission({ ...EMPTY_PERMISSION, module });
    setLockedPermissionModule(Boolean(module));
    setShowPermissionModal(true);
  };

  const closePermissionModal = () => {
    if (creatingPermission) return;
    setShowPermissionModal(false);
    setNewPermission(EMPTY_PERMISSION);
    setLockedPermissionModule(false);
  };

  const handleCreatePermission = async () => {
    const permission = {
      ...newPermission,
      name: newPermission.name.trim(),
      description: newPermission.description.trim(),
      module: newPermission.module.trim(),
      path: newPermission.path.trim(),
      scope: newPermission.scope || null,
    };

    if (
      !permission.name ||
      !permission.description ||
      !permission.module ||
      !permission.path
    )
      return;

    setCreatingPermission(true);
    try {
      const createdId = await permissionRoleApi.createPermission(permission);
      setPermissions((prev) => [...prev, { id: createdId, ...permission }]);
      setExpandedModules((prev) => new Set(prev).add(permission.module));
      showToast("success", `Permission "${permission.name}" created.`);
      setShowPermissionModal(false);
      setNewPermission(EMPTY_PERMISSION);
      setLockedPermissionModule(false);
    } catch {
      showToast("error", "Failed to create permission. Please try again.");
    } finally {
      setCreatingPermission(false);
    }
  };

  const startEditingPermission = (permission) => {
    setEditingPermissionId(permission.id);
    setPermissionEdit({
      name: permission.name,
      description: permission.description,
    });
  };

  const cancelEditingPermission = () => {
    if (updatingPermission) return;
    setEditingPermissionId(null);
    setPermissionEdit({ name: "", description: "" });
  };

  const handleUpdatePermission = async (permissionId) => {
    const data = {
      name: permissionEdit.name.trim(),
      description: permissionEdit.description.trim(),
    };
    if (!data.name || !data.description) return;

    setUpdatingPermission(true);
    try {
      await permissionRoleApi.updatePermission(permissionId, data);
      setPermissions((prev) =>
        prev.map((permission) =>
          permission.id === permissionId
            ? { ...permission, ...data }
            : permission,
        ),
      );
      setEditingPermissionId(null);
      setPermissionEdit({ name: "", description: "" });
      showToast("success", "Permission updated successfully.");
    } catch {
      showToast("error", "Failed to update permission. Please try again.");
    } finally {
      setUpdatingPermission(false);
    }
  };

  const handleDeletePermission = async (permission) => {
    if (
      !window.confirm(
        `Delete permission "${permission.name}"? This will remove it from every role.`,
      )
    )
      return;

    setDeletingPermissionId(permission.id);
    try {
      await permissionRoleApi.deletePermission(permission.id);
      setPermissions((prev) =>
        prev.filter((item) => item.id !== permission.id),
      );
      setAssignedIds((prev) => {
        const next = new Set(prev);
        next.delete(permission.id);
        return next;
      });
      setDraftIds((prev) => {
        const next = new Set(prev);
        next.delete(permission.id);
        return next;
      });
      if (editingPermissionId === permission.id) cancelEditingPermission();
      showToast("success", `Permission "${permission.name}" deleted.`);
    } catch {
      showToast("error", "Failed to delete permission. Please try again.");
    } finally {
      setDeletingPermissionId(null);
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await permissionRoleApi.deleteRole(roleId);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      showToast("success", `Role deleted successfully.`);
    } catch {
      showToast("error", "Failed to delete role. Please try again.");
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedRoleId) return;

    loadRolePermissions();
  }, [selectedRoleId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <p>Loading roles &amp; permissions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <h1>Roles &amp; Permissions Matrix</h1>
        </div>
        <div className={styles.pageHeaderActions}>
          <button
            className={styles.btnOutline}
            onClick={() => setShowCreateModal(true)}
          >
            <MdAdd size={14} />
            Create New Role
          </button>
          <button
            className={styles.btnOutline}
            onClick={() => openPermissionModal()}
          >
            <MdCode size={14} />
            Define API Permission
          </button>
        </div>
      </div>

      {/* Two-column body */}
      <div className={styles.contentBody}>
        {/* ── Left: Roles ── */}
        <div className={styles.rolesPanel}>
          <div className={styles.rolesPanelHeader}>
            <div className={styles.rolesPanelTitle}>
              <HiOutlineShieldCheck size={14} />
              System Roles
              <span className={styles.roleBadge}>{roles.length}</span>
            </div>
            <button
              className={styles.addRoleBtn}
              title="Add role"
              onClick={() => setShowCreateModal(true)}
            >
              <MdAdd size={13} />
            </button>
          </div>

          <div className={styles.searchBox}>
            <MdSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search roles (Ctrl+K)…"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
            />
          </div>

          <div className={styles.rolesList}>
            {filteredRoles.map((role) => {
              const isActive = role.id === selectedRoleId;
              const count = isActive ? draftIds.size : role.permissionCount;
              const isAll =
                role.totalPermissions && count === role.totalPermissions;
              return (
                <div
                  key={role.id}
                  className={`${styles.roleItem} ${isActive ? styles.active : ""}`}
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  <div className={styles.roleItemTop}>
                    <div className={styles.roleItemName}>
                      <MdShield size={13} />
                      {role.name}
                      {isActive && (
                        <span className={styles.selectedBadge}>Selected</span>
                      )}
                    </div>
                    <span className={styles.statusActiveBadge}>
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#3fb950",
                          display: "inline-block",
                        }}
                      />
                      Active
                    </span>
                  </div>
                  <div className={styles.roleItemDesc}>{role.description}</div>
                  <div className={styles.roleItemMeta}>
                    <span>
                      <span
                        className={isAll ? styles.allGranted : styles.permCount}
                      >
                        {count}
                      </span>
                      {role.totalPermissions ? `/${role.totalPermissions}` : ""}{" "}
                      {isAll ? "All Granted" : "Permissions"}
                    </span>
                    <span>
                      {role.accountCount ?? 0}{" "}
                      {role.accountCount === 2 ? "Core Accounts" : "Accounts"}
                    </span>
                  </div>
                  <div className={styles.roleActions}>
                    <button
                      className={styles.roleActionBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MdEdit size={10} /> Edit Role
                    </button>
                    <button
                      className={styles.roleActionBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MdContentCopy size={10} /> Clone
                    </button>
                    <button
                      className={`${styles.roleActionBtn} ${styles.danger}`}
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      <MdDelete size={10} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: Permissions ── */}
        <div className={styles.permissionsPanel}>
          {/* Panel header row */}
          <div className={styles.permPanelHeader}>
            <div>
              <div className={styles.roleTitleRow}>
                <h2>Role: {selectedRole?.name}</h2>
                {selectedRole?.description && (
                  <span className={styles.roleTitleBadge}>
                    {selectedRole.description}
                  </span>
                )}
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusPill}>
                  <span className={styles.statusDot} />
                  Status: Active
                </span>
                <span className={styles.permEnabledLabel}>
                  <BsCheckCircleFill size={12} color="#3fb950" />
                  <strong>{draftIds.size}</strong>
                  {permissions.length > 0 ? `/${permissions.length}` : ""}{" "}
                  Permissions Enabled
                </span>
              </div>
            </div>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              <MdSave size={14} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            {/* Filter + toggle */}
            <div className={styles.toolbarTop}>
              <div className={styles.filterWrapper}>
                <MdFilterList className={styles.filterIcon} />
                <input
                  className={styles.filterInput}
                  type="text"
                  placeholder="Filter permissions by name, path or method (/api/v1/…)"
                  value={permFilter}
                  onChange={(e) => setPermFilter(e.target.value)}
                />
              </div>
              <label className={styles.toggleLabel}>
                <span className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={showAssignedOnly}
                    onChange={(e) => setShowAssignedOnly(e.target.checked)}
                  />
                  <span className={styles.toggleSlider} />
                </span>
                Show Assigned Only
              </label>
            </div>

            {/* Method filter */}
            <div className={styles.methodsRow}>
              <span className={styles.tabRowLabel}>Method:</span>
              {HTTP_METHODS.map((m) => (
                <button
                  key={m}
                  className={`${styles.methodTab} ${activeMethod === m ? styles.activeMethod : ""}`}
                  onClick={() => setActiveMethod(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Permissions grouped by module */}
          <div className={styles.modulesList}>
            {permissionsByModule.length === 0 ? (
              <div className={styles.emptyPermissions}>
                No permissions match the current filter.
              </div>
            ) : (
              permissionsByModule.map(([module, modulePermissions]) => {
                const isExpanded = expandedModules.has(module);
                const assignedCount = modulePermissions.all.filter(
                  (permission) => draftIds.has(permission.id),
                ).length;
                const allChecked =
                  modulePermissions.all.length > 0 &&
                  assignedCount === modulePermissions.all.length;
                const hasAssignedPermissions = assignedCount > 0;
                const assignedPercentage = modulePermissions.all.length
                  ? (assignedCount / modulePermissions.all.length) * 100
                  : 0;

                return (
                  <section className={styles.moduleSection} key={module}>
                    <div className={styles.moduleHeader}>
                      <button
                        className={styles.moduleToggle}
                        onClick={() => toggleModule(module)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <MdKeyboardArrowDown size={19} />
                        ) : (
                          <MdKeyboardArrowRight size={19} />
                        )}
                        <span className={styles.moduleName}>{module}</span>
                      </button>
                      <div className={styles.moduleAssignmentSummary}>
                        <span className={styles.moduleCount}>
                          {assignedCount}/{modulePermissions.all.length}{" "}
                          assigned
                        </span>
                        <span className={styles.moduleProgress}>
                          <span
                            className={styles.moduleProgressValue}
                            style={{ width: `${assignedPercentage}%` }}
                          />
                        </span>
                      </div>
                      <div className={styles.moduleActions}>
                        <button
                          className={styles.moduleActionBtn}
                          onClick={() =>
                            grantModulePermissions(modulePermissions.all)
                          }
                          disabled={allChecked}
                        >
                          <MdSelectAll size={14} /> Grant all
                        </button>
                        <button
                          className={`${styles.moduleActionBtn} ${styles.revoke}`}
                          onClick={() =>
                            revokeModulePermissions(modulePermissions.all)
                          }
                          disabled={!hasAssignedPermissions}
                        >
                          <MdClose size={13} /> Revoke all
                        </button>
                        <button
                          className={styles.addPermissionBtn}
                          onClick={() => openPermissionModal(module)}
                        >
                          <MdAdd size={14} /> Add Permission
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.moduleTableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>
                                <input
                                  type="checkbox"
                                  className={styles.checkbox}
                                  checked={
                                    modulePermissions.visible.length > 0 &&
                                    modulePermissions.visible.every(
                                      (permission) =>
                                        draftIds.has(permission.id),
                                    )
                                  }
                                  ref={(element) => {
                                    if (element)
                                      element.indeterminate =
                                        modulePermissions.visible.some(
                                          (permission) =>
                                            draftIds.has(permission.id),
                                        ) &&
                                        !modulePermissions.visible.every(
                                          (permission) =>
                                            draftIds.has(permission.id),
                                        );
                                  }}
                                  onChange={(event) => {
                                    if (event.target.checked)
                                      grantModulePermissions(
                                        modulePermissions.visible,
                                      );
                                    else
                                      revokeModulePermissions(
                                        modulePermissions.visible,
                                      );
                                  }}
                                />
                              </th>
                              <th>Name</th>
                              <th>Module</th>
                              <th>Method</th>
                              <th>Path</th>
                              <th>Scope</th>
                              <th>Description</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modulePermissions.visible.map((permission) => {
                              const isEditing =
                                editingPermissionId === permission.id;
                              const isDeleting =
                                deletingPermissionId === permission.id;

                              return (
                                <tr key={permission.id}>
                                  <td>
                                    <input
                                      type="checkbox"
                                      className={styles.checkbox}
                                      checked={draftIds.has(permission.id)}
                                      onChange={() =>
                                        togglePermission(permission.id)
                                      }
                                    />
                                  </td>
                                  <td className={styles.permissionNameCell}>
                                    {isEditing ? (
                                      <input
                                        className={styles.inlineEditInput}
                                        value={permissionEdit.name}
                                        onChange={(event) =>
                                          setPermissionEdit((prev) => ({
                                            ...prev,
                                            name: event.target.value,
                                          }))
                                        }
                                        autoFocus
                                      />
                                    ) : (
                                      permission.name
                                    )}
                                  </td>
                                  <td>
                                    <span className={styles.moduleBadge}>
                                      {permission.module}
                                    </span>
                                  </td>
                                  <td>
                                    <span
                                      className={`${styles.methodBadge} ${styles[permission.method]}`}
                                    >
                                      {permission.method}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={styles.pathMain}>
                                      {permission.path}
                                    </span>
                                  </td>
                                  <td>
                                    <span className={styles.scopeBadge}>
                                      {permission.scope || "—"}
                                    </span>
                                  </td>
                                  <td className={styles.descriptionCell}>
                                    {isEditing ? (
                                      <input
                                        className={styles.inlineEditInput}
                                        value={permissionEdit.description}
                                        onChange={(event) =>
                                          setPermissionEdit((prev) => ({
                                            ...prev,
                                            description: event.target.value,
                                          }))
                                        }
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter")
                                            handleUpdatePermission(
                                              permission.id,
                                            );
                                          if (event.key === "Escape")
                                            cancelEditingPermission();
                                        }}
                                      />
                                    ) : (
                                      permission.description
                                    )}
                                  </td>
                                  <td>
                                    <div className={styles.permissionActions}>
                                      {isEditing ? (
                                        <>
                                          <button
                                            className={styles.inlineSaveBtn}
                                            onClick={() =>
                                              handleUpdatePermission(
                                                permission.id,
                                              )
                                            }
                                            disabled={
                                              updatingPermission ||
                                              !permissionEdit.name.trim() ||
                                              !permissionEdit.description.trim()
                                            }
                                          >
                                            <MdSave size={13} /> Save
                                          </button>
                                          <button
                                            className={styles.inlineCancelBtn}
                                            onClick={cancelEditingPermission}
                                            disabled={updatingPermission}
                                          >
                                            <MdClose size={13} /> Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            className={styles.inlineUpdateBtn}
                                            onClick={() =>
                                              startEditingPermission(permission)
                                            }
                                            disabled={
                                              Boolean(editingPermissionId) ||
                                              Boolean(deletingPermissionId)
                                            }
                                          >
                                            <MdEdit size={13} /> Update
                                          </button>
                                          <button
                                            className={styles.inlineDeleteBtn}
                                            onClick={() =>
                                              handleDeletePermission(permission)
                                            }
                                            disabled={
                                              Boolean(editingPermissionId) ||
                                              Boolean(deletingPermissionId)
                                            }
                                          >
                                            <MdDelete size={13} />
                                            {isDeleting
                                              ? "Deleting…"
                                              : "Delete"}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowCreateModal(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>
              <MdAdd size={17} /> Create New Role
            </h3>
            <div className={styles.modalField}>
              <label>Role Name *</label>
              <input
                type="text"
                placeholder="e.g. MODERATOR"
                value={newRole.name}
                onChange={(e) =>
                  setNewRole((p) => ({ ...p, name: e.target.value }))
                }
                autoFocus
              />
            </div>
            <div className={styles.modalField}>
              <label>Description</label>
              <textarea
                rows={3}
                placeholder="Describe what this role can do…"
                value={newRole.description}
                onChange={(e) =>
                  setNewRole((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnOutline}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleCreateRole}
                disabled={!newRole.name.trim() || creating}
              >
                {creating ? "Creating…" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Permission Modal */}
      {showPermissionModal && (
        <div className={styles.modalOverlay} onClick={closePermissionModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>
              <MdAdd size={17} /> Create API Permission
            </h3>
            <div className={styles.modalField}>
              <label>Module *</label>
              <input
                type="text"
                placeholder="e.g. PROJECT"
                value={newPermission.module}
                readOnly={lockedPermissionModule}
                onChange={(e) =>
                  setNewPermission((prev) => ({
                    ...prev,
                    module: e.target.value,
                  }))
                }
              />
            </div>
            <div className={styles.modalField}>
              <label>Permission Name *</label>
              <input
                type="text"
                placeholder="e.g. List projects"
                value={newPermission.name}
                onChange={(e) =>
                  setNewPermission((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                autoFocus
              />
            </div>
            <div className={styles.modalFieldRow}>
              <div className={styles.modalField}>
                <label>Method *</label>
                <select
                  value={newPermission.method}
                  onChange={(e) =>
                    setNewPermission((prev) => ({
                      ...prev,
                      method: e.target.value,
                    }))
                  }
                >
                  {HTTP_METHODS.slice(1).map((method) => (
                    <option value={method} key={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.modalField}>
                <label>Scope</label>
                <select
                  value={newPermission.scope}
                  onChange={(e) =>
                    setNewPermission((prev) => ({
                      ...prev,
                      scope: e.target.value,
                    }))
                  }
                >
                  <option value="">None</option>
                  <option value="OWN">OWN</option>
                </select>
              </div>
            </div>
            <div className={styles.modalField}>
              <label>Path *</label>
              <input
                type="text"
                placeholder="e.g. /projects"
                value={newPermission.path}
                onChange={(e) =>
                  setNewPermission((prev) => ({
                    ...prev,
                    path: e.target.value,
                  }))
                }
              />
            </div>
            <div className={styles.modalField}>
              <label>Description *</label>
              <textarea
                rows={3}
                placeholder="Describe what this permission allows…"
                value={newPermission.description}
                onChange={(e) =>
                  setNewPermission((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnOutline}
                onClick={closePermissionModal}
                disabled={creatingPermission}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleCreatePermission}
                disabled={
                  creatingPermission ||
                  !newPermission.name.trim() ||
                  !newPermission.description.trim() ||
                  !newPermission.module.trim() ||
                  !newPermission.path.trim()
                }
              >
                {creatingPermission ? "Creating…" : "Create Permission"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.type === "success" ? (
            <MdCheckCircle size={15} />
          ) : (
            <MdError size={15} />
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
