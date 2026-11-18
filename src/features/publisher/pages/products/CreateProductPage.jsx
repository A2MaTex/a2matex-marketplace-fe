import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateProductDialog from "./CreateProductDialog";
import ProductEditor from "./ProductEditor";
import { useEligibleProjects } from "./hooks/useEligibleProjects";
import styles from "./CreateProductPage.module.css";

const CreateProductPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dirty, setDirty] = useState(false);
  const eligibleState = useEligibleProjects(true);
  const projectId = searchParams.get("projectId");
  const selectedProject = useMemo(
    () => eligibleState.data.find((project) => project.id === projectId) ?? null,
    [eligibleState.data, projectId],
  );

  const catalogUrl = useMemo(() => {
    const query = new URLSearchParams();
    const returnStatus = searchParams.get("returnStatus");
    const returnPage = searchParams.get("returnPage");
    if (returnStatus) query.set("status", returnStatus);
    if (returnPage && returnPage !== "1") query.set("page", returnPage);
    const value = query.toString();
    return `/publisher/products${value ? `?${value}` : ""}`;
  }, [searchParams]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const mayLeave = () =>
    !dirty || window.confirm("Discard your unsaved product changes?");

  const goBack = () => {
    if (mayLeave()) navigate(catalogUrl);
  };

  const chooseProject = (project) => {
    const next = new URLSearchParams(searchParams);
    next.set("projectId", project.id);
    navigate(`/publisher/products/create?${next.toString()}`);
  };

  const changeProject = () => {
    if (!mayLeave()) return;
    setDirty(false);
    const next = new URLSearchParams(searchParams);
    next.delete("projectId");
    const value = next.toString();
    navigate(`/publisher/products/create${value ? `?${value}` : ""}`);
  };

  const handleCreated = (id) => {
    setDirty(false);
    navigate(`/publisher/products/${id}?status=DRAFT`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={goBack} aria-label="Back to products">
          <FiArrowLeft aria-hidden="true" />
        </button>
        <div className={styles.titleBlock}>
          <div>
            <p>Publisher catalog</p>
            <h1>New product setup</h1>
            <small>{selectedProject ? `Source project: ${selectedProject.name}` : "Choose a source project to continue."}</small>
          </div>
        </div>
      </header>

      <main className={styles.formArea}>
        {selectedProject ? (
          <ProductEditor
            key={`create:${selectedProject.id}`}
            creating
            standalone
            product={null}
            project={selectedProject}
            onCreated={handleCreated}
            onSaved={() => {}}
            onArchive={() => {}}
            onDirtyChange={setDirty}
            onChangeProject={changeProject}
          />
        ) : null}
      </main>

      {!selectedProject ? (
        <CreateProductDialog
          projects={eligibleState.data}
          loading={eligibleState.loading}
          error={eligibleState.error}
          onRetry={eligibleState.refetch}
          onClose={goBack}
          onContinue={chooseProject}
        />
      ) : null}
    </div>
  );
};

export default CreateProductPage;
