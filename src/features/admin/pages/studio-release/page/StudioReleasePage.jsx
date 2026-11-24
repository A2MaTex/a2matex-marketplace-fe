import DistributionReleasePage from "../../distribution-release/page/DistributionReleasePage";
import { studioReleaseConfig } from "../studioReleaseConfig";

export default function StudioReleasePage() {
  return <DistributionReleasePage config={studioReleaseConfig} />;
}
