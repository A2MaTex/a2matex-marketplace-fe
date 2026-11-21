import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiClock,
  FiPlus,
  FiSave,
  FiTrash2,
} from "react-icons/fi";
import { MdAllInclusive } from "react-icons/md";
import { publisherProductApi } from "../api/product/api";
import { parseProductEnvelope } from "./model/productContract";
import {
  buildProductOfferReplacement,
  PRODUCT_OFFER_FORM_LIMITS,
  ProductOfferValidationError,
} from "./model/productOfferForm";
import { toProductOfferError } from "./model/productOfferError";
import styles from "./ProductOfferEditor.module.css";

const editableOffer = (offer) => ({
  id: offer.id ?? null,
  type: offer.type,
  priceAmount: offer.priceAmount,
  durationDays: offer.durationDays,
});

const signatureOf = (offers) =>
  JSON.stringify(
    offers.map(({ type, priceAmount, durationDays }) => ({
      type,
      priceAmount,
      durationDays,
    })),
  );

const newSubscription = () => ({
  id: null,
  type: "SUBSCRIPTION",
  priceAmount: "",
  durationDays: 30,
});

const newOneTime = () => ({
  id: null,
  type: "ONE_TIME",
  priceAmount: "",
  durationDays: null,
});

export default function ProductOfferEditor({
  product,
  disabled,
  onSaved,
  onDirtyChange,
}) {
  const initialOffers = useMemo(
    () => (product.offers ?? []).map(editableOffer),
    [product.offers],
  );
  const [offers, setOffers] = useState(initialOffers);
  const [savedSignature, setSavedSignature] = useState(() =>
    signatureOf(initialOffers),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const dirty = signatureOf(offers) !== savedSignature;
  const hasOneTime = offers.some((offer) => offer.type === "ONE_TIME");

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  const updateOffer = (index, patch) => {
    setError(null);
    setNotice(null);
    setOffers((current) =>
      current.map((offer, offerIndex) =>
        offerIndex === index ? { ...offer, ...patch } : offer,
      ),
    );
  };

  const addOffer = (type) => {
    if (offers.length >= PRODUCT_OFFER_FORM_LIMITS.maxOffers) return;
    setError(null);
    setNotice(null);
    setOffers((current) => [
      ...current,
      type === "ONE_TIME" ? newOneTime() : newSubscription(),
    ]);
  };

  const removeOffer = (index) => {
    setError(null);
    setNotice(null);
    setOffers((current) => current.filter((_, offerIndex) => offerIndex !== index));
  };

  const saveOffers = async () => {
    if (disabled || saving || !dirty) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = buildProductOfferReplacement(offers);
      if (
        product.status === "ACTIVE" &&
        !payload.offers.some((offer) => offer.type === "SUBSCRIPTION")
      ) {
        throw new ProductOfferValidationError(
          "An active product must keep at least one subscription offer.",
          "offers",
        );
      }
      await publisherProductApi.replaceOffers(product.id, payload);
      const detailResponse = await publisherProductApi.getProduct(product.id);
      const refreshed = parseProductEnvelope(detailResponse.data);
      const nextOffers = refreshed.offers.map(editableOffer);
      setSavedSignature(signatureOf(nextOffers));
      setOffers(nextOffers);
      setNotice("Offers saved from the latest server state.");
      onSaved?.(refreshed);
    } catch (saveError) {
      setError(toProductOfferError(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.editor} aria-busy={saving}>
      <div className={styles.summaryRow}>
        <div>
          <strong>{offers.length} / {PRODUCT_OFFER_FORM_LIMITS.maxOffers} offers</strong>
          <span>Price is stored as an exact VND integer string.</span>
        </div>
        <div className={styles.addActions}>
          <button
            type="button"
            onClick={() => addOffer("SUBSCRIPTION")}
            disabled={disabled || saving || offers.length >= PRODUCT_OFFER_FORM_LIMITS.maxOffers}
          >
            <FiPlus /> Subscription
          </button>
          <button
            type="button"
            onClick={() => addOffer("ONE_TIME")}
            disabled={disabled || saving || hasOneTime || offers.length >= PRODUCT_OFFER_FORM_LIMITS.maxOffers}
            title={hasOneTime ? "Only one lifetime offer is allowed." : "Add lifetime access"}
          >
            <FiPlus /> One-time
          </button>
        </div>
      </div>

      {offers.length ? (
        <div className={styles.offerGrid}>
          {offers.map((offer, index) => {
            const lifetime = offer.type === "ONE_TIME";
            return (
              <article className={styles.offerCard} key={offer.id ?? `new-${index}`}>
                <header>
                  <span className={lifetime ? styles.lifetimeIcon : styles.subscriptionIcon}>
                    {lifetime ? <MdAllInclusive /> : <FiClock />}
                  </span>
                  <div>
                    <strong>{lifetime ? "Lifetime access" : "Subscription"}</strong>
                    <small>{lifetime ? "No duration" : "Recurring access period"}</small>
                  </div>
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeOffer(index)}
                    disabled={disabled || saving}
                    aria-label={`Remove ${lifetime ? "lifetime" : "subscription"} offer ${index + 1}`}
                  >
                    <FiTrash2 />
                  </button>
                </header>

                <div className={styles.offerFields}>
                  <label>
                    <span>Type</span>
                    <select
                      value={offer.type}
                      disabled={disabled || saving}
                      onChange={(event) => {
                        const type = event.target.value;
                        updateOffer(index, {
                          type,
                          durationDays: type === "ONE_TIME" ? null : 30,
                        });
                      }}
                    >
                      <option value="SUBSCRIPTION">Subscription</option>
                      <option value="ONE_TIME">One-time</option>
                    </select>
                  </label>
                  <label>
                    <span>Price (VND)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={offer.priceAmount}
                      disabled={disabled || saving}
                      placeholder="e.g. 120000"
                      maxLength={19}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (/^\d*$/.test(value)) updateOffer(index, { priceAmount: value });
                      }}
                    />
                  </label>
                  <label>
                    <span>Duration (days)</span>
                    <input
                      type="number"
                      min="1"
                      max={PRODUCT_OFFER_FORM_LIMITS.maxDurationDays}
                      value={offer.durationDays ?? ""}
                      disabled={disabled || saving || lifetime}
                      placeholder={lifetime ? "Lifetime" : "30"}
                      onChange={(event) =>
                        updateOffer(index, {
                          durationDays: event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>
          No offers configured. A positive-price subscription is required before activation.
        </div>
      )}

      <div className={styles.fullReplacementNote}>
        <FiAlertTriangle /> Saving replaces the complete offer set. Removed rows are deactivated by the server.
      </div>
      {product.status === "ACTIVE" ? (
        <p className={styles.activeWarning}>
          Active products must retain a subscription offer and are subject to the server change-rate window.
        </p>
      ) : null}
      {error ? <p className={styles.error} role="alert">{error.message}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

      <div className={styles.saveRow}>
        <button
          type="button"
          className={styles.saveButton}
          onClick={saveOffers}
          disabled={disabled || saving || !dirty}
        >
          <FiSave /> {saving ? "Saving offers…" : "Save offers"}
        </button>
      </div>
    </div>
  );
}
