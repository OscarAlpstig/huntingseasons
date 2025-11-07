import { useState } from 'react';
import './App.css'
import Menu from './Menu'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import JakttidRow from './JakttidRow'
import Soltider from './Soltider'
import { getFaglarList, getDaggdjurList } from './jaktTiderLoader';

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [faglar, setFaglar] = useState(true);
  const [daggdjur, setDaggdjur] = useState(true);
  const [activeMenu, setActiveMenu] = useState('jakttider');

  const jaktTider = [
    ...(faglar ? getFaglarList() : []),
    ...(daggdjur ? getDaggdjurList() : []),
  ];

  return (
    <>
      <Menu activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <div style={{ padding: '1rem' }}>
        <DatePicker
          selected={selectedDate}
          onChange={date => setSelectedDate(date || new Date())}
          dateFormat="yyyy-MM-dd"
        />
        <button
          type="button"
          style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem' }}
          onClick={() => setSelectedDate(new Date())}
        >
          Idag
        </button>
        {activeMenu === 'jakttider' && (
          <>
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ marginRight: '1rem' }}>
                <input
                  type="checkbox"
                  checked={faglar}
                  onChange={e => setFaglar(e.target.checked)}
                /> Fåglar
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={daggdjur}
                  onChange={e => setDaggdjur(e.target.checked)}
                /> Däggdjur
              </label>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <h3>Jakttider</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: '1px solid #264D26', textAlign: 'left' }}>Art</th>
                    <th style={{ borderBottom: '1px solid #264D26', textAlign: 'left' }}>Information / Regler</th>
                    <th style={{ borderBottom: '1px solid #264D26', textAlign: 'left' }}>Jakttider</th>
                    <th style={{ borderBottom: '1px solid #264D26', textAlign: 'left' }}>Län</th>
                  </tr>
                </thead>
                <tbody>
                  {jaktTider
                    .filter(row => selectedDate >= row.start && selectedDate <= row.end)
                    .map((row, idx) => (
                      <JakttidRow
                        key={idx}
                        art={row.art}
                        info={row.info}
                        regler={row.regler}
                        tider={`${row.start.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })} - ${row.end.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}`}
                        lan={row.lan}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {activeMenu === 'soltider' && (
          <Soltider date={selectedDate} lat={59.3293} lon={18.0686} />
        )}
      </div>
    </>
  );
}

export default App
