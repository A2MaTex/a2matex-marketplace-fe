import { IoStarSharp } from "react-icons/io5";
import { BsCartPlus } from "react-icons/bs";
import { MdOutlineTerminal } from "react-icons/md";
import { FiZap } from "react-icons/fi";
import Button from "@components/common/Button";
import styles from "./ProductCard.module.css";
import { Link } from "react-router-dom";

/**
 * @param {{
 *   title: string,
 *   author: string,
 *   description: string,
 *   price: number,
 *   lifetimePrice?: number,
 *   rating: number,
 *   reviews: number,
 *   badge?: string,
 *   featured?: boolean,
 *   version?: string,
 * }} props
 */
const ProductCard = ({
  id,
  title,
  author,
  description,
  price,
  lifetimePrice,
  rating,
  reviews,
  badge,
  featured = false,
  version,
}) => {
  return (
    <Link className={styles.link} to={`/products/${id}`}>
      <article
        className={[styles.card, featured ? styles.featured : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Badge */}
        {badge && (
          <div className={styles.badge}>
            <FiZap size={11} />
            {badge}
          </div>
        )}

        {/* Header row */}
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <MdOutlineTerminal size={featured ? 22 : 20} />
          </div>

          {!featured && (
            <div className={styles.ratingWrap}>
              <IoStarSharp size={12} color="#f59e0b" />
              <span className={styles.ratingValue}>{rating.toFixed(1)}</span>
              <span className={styles.ratingCount}>
                ({reviews.toLocaleString()})
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className={styles.body}>
          <h3 className={styles.title}>
            {title}
            {version && <span className={styles.version}>{version}</span>}
          </h3>

          {featured ? (
            <p className={styles.authorFeatured}>
              Authored by <span className={styles.authorLink}>{author}</span>
            </p>
          ) : (
            <p className={styles.author}>By {author}</p>
          )}

          <p className={styles.desc}>{description}</p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.pricing}>
            <span className={styles.price}>${price}</span>
            <span className={styles.pricePer}>/mo</span>
            {lifetimePrice && (
              <span className={styles.lifetime}>
                or{" "}
                <span className={styles.lifetimeVal}>
                  ${lifetimePrice} Lifetime
                </span>
              </span>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cartBtn}>
              Add To Cart
            </button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={featured ? <BsCartPlus size={14} /> : undefined}
            >
              {featured ? "Purchase Now" : "Purchase"}
            </Button>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
