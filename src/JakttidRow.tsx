import React from 'react';

interface JakttidRowProps {
  art: string;
  info: string;
  tider: string;
}

const JakttidRow: React.FC<JakttidRowProps> = ({ art, info, tider }) => (
  <tr>
    <td style={{ padding: '0.5rem 0' }}>{art}</td>
    <td style={{ padding: '0.5rem 0' }}>{info}</td>
    <td style={{ padding: '0.5rem 0' }}>{tider}</td>
  </tr>
);

export default JakttidRow;

