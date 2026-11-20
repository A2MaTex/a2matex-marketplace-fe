import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiLayers, FiSearch, FiZap } from "react-icons/fi";
import demoVideo from "@/assets/demo.mp4";
import styles from "./HeroSection.module.css";
import { LuWorkflow } from "react-icons/lu";

const VIDEO_PLAYBACK_RATE = 1.18;

const HeroSection = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const syncPlayback = () => {
      video.playbackRate = VIDEO_PLAYBACK_RATE;
      if (motionPreference.matches) {
        video.pause();
      } else {
        video.play().catch(() => undefined);
      }
    };

    syncPlayback();
    motionPreference.addEventListener?.("change", syncPlayback);
    return () => motionPreference.removeEventListener?.("change", syncPlayback);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.videoLayer} aria-hidden="true">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
        >
          <source src={demoVideo} type="video/mp4" />
        </video>
      </div>
      <div className={styles.videoVeil} aria-hidden="true" />
      <div className={styles.aurora} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <div className={styles.kicker}>
            <span /> A2MATEX · ANDROID AUTOMATION PLATFORM
          </div>
          <h1>
            Find the workflow.
            <span>Keep the momentum.</span>
          </h1>
          <p className={styles.lead}>
            Build and test visual workflows in Studio. Publish them to
            Marketplace, then install and run them on a connected Android device
            with Launcher.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href="#marketplace-catalog">
              <span className={styles.actionIcon}><FiSearch aria-hidden="true" /></span>
              <span>Explore the catalog</span>
            </a>
            <Link className={styles.secondaryAction} to="/studio">
              <span className={styles.actionIcon}><FiZap aria-hidden="true" /></span>
              <span>Build with Studio</span>
            </Link>
          </div>
        </div>

        <aside className={styles.signalPanel} aria-label="Marketplace overview">
          <span className={styles.signalLabel}>Public release network</span>
          <div className={styles.signalLine} />
          <div className={styles.signalMeta}>
            <span>
              <FiLayers aria-hidden="true" /> Versioned releases
            </span>
            <span>
              <LuWorkflow aria-hidden="true" /> Design and test visually
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default HeroSection;
