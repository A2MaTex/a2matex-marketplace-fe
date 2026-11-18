import { useCallback, useMemo, useState } from "react";
import {
  createProductForm,
  generateProductSlug,
  isProductFormDirty,
} from "../model/productForm";

export function useProductEditor({ product, project }) {
  const [initialForm, setInitialForm] = useState(() =>
    createProductForm({ product, project }),
  );
  const [form, setForm] = useState(initialForm);
  const [manualSlug, setManualSlug] = useState(Boolean(product?.slug));

  const setField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const setName = useCallback(
    (value) => {
      setForm((current) => ({
        ...current,
        name: value,
        ...(!manualSlug ? { slug: generateProductSlug(value) } : {}),
      }));
    },
    [manualSlug],
  );

  const setSlug = useCallback((value) => {
    setManualSlug(true);
    setForm((current) => ({ ...current, slug: value }));
  }, []);

  const setMedia = useCallback((media) => {
    setForm((current) => ({ ...current, media }));
  }, []);

  const reset = useCallback(() => {
    setForm(initialForm);
    setManualSlug(Boolean(product?.slug));
  }, [initialForm, product?.slug]);

  const acknowledge = useCallback((nextProduct) => {
    const initial = createProductForm({ product: nextProduct, project });
    setInitialForm(initial);
    setForm(initial);
    setManualSlug(Boolean(nextProduct?.slug));
  }, [project]);

  const dirty = useMemo(() => {
    try {
      return isProductFormDirty(form, initialForm);
    } catch {
      return true;
    }
  }, [form, initialForm]);

  return {
    form,
    initialForm,
    dirty,
    setField,
    setName,
    setSlug,
    setMedia,
    reset,
    acknowledge,
  };
}
