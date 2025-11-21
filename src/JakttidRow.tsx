import React from 'react';

interface JakttidRowProps {
  art: string;
  info: string;
  regler: string;
  tider: string;
}

const JakttidRow = ({ art, info, regler, tider }: JakttidRowProps) => {
  return (
    <tr>
      <td style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>{art}</td>
      <td style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>
        <div><strong>{info}</strong></div>
        <div style={{ fontSize: '0.9em', color: '#666' }}>{regler}</div>
      </td>
      <td style={{ borderBottom: '1px solid #ddd', padding: '0.5rem' }}>{tider}</td>
    </tr>
  );
};
export default JakttidRow;
