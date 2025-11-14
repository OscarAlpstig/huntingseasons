import {useEffect, useRef} from 'react';

const PlanetPhase = ({containerId, phase, isWaxing, config}) => {
    const containerRef = useRef(null);
    const outerBoxRef = useRef(null);
    const innerBoxRef = useRef(null);

    useEffect(() => {
        const calcInner = (outerDiameter, semiPhase) => {
            let innerRadius,
                absPhase = Math.abs(semiPhase),
                n = ((1 - absPhase) * outerDiameter / 2) || 0.01;

            innerRadius = n / 2 + outerDiameter * outerDiameter / (8 * n);

            return {
                d: innerRadius * 2,
                o: semiPhase > 0 ? (outerDiameter / 2 - n) : (-2 * innerRadius + outerDiameter / 2 + n)
            };
        };

        const setCss = (el, props) => {
            for (const p in props) {
                el.style[p] = props[p];
            }
        };

        const drawDiscs = (outer, inner, blurSize) => {
            const blurredDiameter = inner.diameter - blurSize;
            const blurredOffset = inner.offset + blurSize / 2;

            setCss(outer.box, {
                'position': 'absolute',
                'height': outer.diameter + 'px',
                'width': outer.diameter + 'px',
                'border': '1px solid black',
                'backgroundColor': outer.colour,
                'borderRadius': (outer.diameter / 2) + 'px',
                'overflow': 'hidden'
            });

            setCss(inner.box, {
                'position': 'absolute',
                'backgroundColor': inner.colour,
                'borderRadius': (blurredDiameter / 2) + 'px',
                'height': blurredDiameter + 'px',
                'width': blurredDiameter + 'px',
                'left': blurredOffset + 'px',
                'top': ((outer.diameter - blurredDiameter) / 2) + 'px',
                'boxShadow': '0px 0px ' + blurSize + 'px ' + blurSize + 'px ' + inner.colour,
                'opacity': inner.opacity
            });
        };

        const setPhase = (phase, isWaxing, config) => {
            let outerColour, innerColour, innerVals;

            if (phase < 0.5) {
                outerColour = config.lightColour;
                innerColour = config.shadowColour;
                if (isWaxing) {
                    phase *= -1;
                }
            } else {
                outerColour = config.shadowColour;
                innerColour = config.lightColour;
                phase = 1 - phase;
                if (!isWaxing) {
                    phase *= -1;
                }
            }

            innerVals = calcInner(config.diameter, phase * 2);

            drawDiscs(
                {
                    box: outerBoxRef.current,
                    diameter: config.diameter,
                    colour: outerColour
                },
                {
                    box: innerBoxRef.current,
                    diameter: innerVals.d,
                    colour: innerColour,
                    offset: innerVals.o,
                    opacity: 1 - config.earthshine
                },
                config.blur
            );
        };

        const defaultConfig = {
            shadowColour: 'black',
            lightColour: 'white',
            diameter: 100,
            earthshine: 0.1,
            blur: 3
        };

        const configValues = {...defaultConfig, ...config};

        if (!containerRef.current || !outerBoxRef.current || !innerBoxRef.current) {
            const containerElement = document.getElementById(containerId);
            const outerBox = document.createElement('div');
            const innerBox = document.createElement('div');
            containerElement.appendChild(outerBox);
            outerBox.appendChild(innerBox);
            containerRef.current = containerElement;
            outerBoxRef.current = outerBox;
            innerBoxRef.current = innerBox;
        }

        setPhase(phase, isWaxing, configValues);

        const setContainerPosition = () => {
            const containerElement = containerRef.current;
            if (containerElement) {
                const containerRect = containerElement.getBoundingClientRect();
                const outerBox = outerBoxRef.current;
                if (outerBox) {
                    outerBox.style.top = `${containerRect.height / 2}px`;
                }
            }
        };

        setContainerPosition();

        window.addEventListener('resize', setContainerPosition);

        return () => {
            window.removeEventListener('resize', setContainerPosition);
        };
    }, [containerId, phase, isWaxing, config]);

    return (
        <div className="relative w-100 h-100" style={{display: "flex", position: "relative", flexDirection:"center"}} id={containerId} ref={containerRef}/>
    );
};

export default PlanetPhase;
