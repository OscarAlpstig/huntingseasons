import './JakttidCard.scss';

interface JakttidCardProps {
    art: string;
    info: string;
    regler: string;
    tider: string;
}

const JakttidCard = ({ art, info, regler, tider }: JakttidCardProps) => {
    return (
        <div className="jakttid-card">
            <div className="animal-icon">
                {/* Placeholder for animal contour */}
                <div className="icon-placeholder"></div>
            </div>
            <div className="card-content">
                <div className="header">
                    <span className="art-name">{art}</span>
                </div>
                <div className="info-section">
                    {info && <div className="info-text">{info}</div>}
                    {regler && <div className="regler-text">{regler}</div>}
                </div>
                <div className="times-section">
                    <span className="times-label">Jakttid:</span>
                    <span className="times-value">{tider}</span>
                </div>
            </div>
        </div>
    );
};

export default JakttidCard;
