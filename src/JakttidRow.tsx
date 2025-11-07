import React from 'react';

interface JakttidRowProps {
  art: string;
  info: string;
  regler?: string;
  tider: string;
  lan?: string[];
}

const JakttidRow: React.FC<JakttidRowProps> = ({ art, info, regler, tider, lan }) => (
  <tr>
    <td style={{ padding: '0.5rem 0' }}>{art}</td>
    <td style={{ padding: '0.5rem 0' }}>{info}{regler ? <><br /><span style={{ color: '#A7C7A7', fontSize: '0.95em' }}>{regler}</span></> : null}</td>
    <td style={{ padding: '0.5rem 0' }}>{tider}</td>
    <td style={{ padding: '0.5rem 0' }}>{lan ? lan.join(', ') : ''}</td>
  </tr>
);

export default JakttidRow;
