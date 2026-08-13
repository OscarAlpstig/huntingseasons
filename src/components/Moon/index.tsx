// @ts-expect-error PlanetPhase is a legacy JavaScript component without declarations.
import PlanetPhase from "./PlanetPhase";

interface MoonProps {
    angle: number | undefined,
    phasePercentage: number
}

const Moon = (props: MoonProps) => {
    const isWaxing = (angle: number | undefined) => {
        let isWaxing = false;
        if (angle != null) {
            isWaxing = Math.sign(angle) === 1;
        }
        return isWaxing;
    }
    return (
        <div style={{ display: "flex", flexDirection: "row" }}>
            <PlanetPhase
                containerId="container"
                phase={props.phasePercentage}
                isWaxing={isWaxing(props.angle)} />
        </div>
    );
}

export default Moon;
