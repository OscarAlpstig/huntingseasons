
// @ts-ignore
import PlanetPhase from "./PlanetPhase";

interface MoonProps {
    angle: number | undefined,
    phasePercentage: number
}

const Moon = (props: MoonProps) => {
    const isWaxing = (angle:number | undefined) => {
        let isWaxing = false;
        if (angle != null) {
            isWaxing = Math.sign(angle) === 1;
        }
        return isWaxing;
    }
    // @ts-ignore
    return (
        <div style={{display: "flex", flexDirection: "row"}}>
            {/*// @ts-ignore*/}
            <PlanetPhase containerId="container" phase={props.phasePercentage} isWaxing={isWaxing(props.angle)}  />
        </div>
    );
}

export default Moon;
