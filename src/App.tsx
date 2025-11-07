import { useState } from 'react';
import './App.css'
import Menu from './Menu'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import JakttidRow from './JakttidRow'
import { getJaktTiderList } from './jaktTiderLoader';

const jaktTider = getJaktTiderList();

function App() {
  // const [count, setCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [faglar, setFaglar] = useState(true);
  const [daggdjur, setDaggdjur] = useState(true);

  return (
    <>
      <Menu />
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
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Art</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Information</th>
                <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Jakttider</th>
              </tr>
            </thead>
            <tbody>
              {jaktTider
                .filter(row => ((faglar && row.typ === 'fågel') || (daggdjur && row.typ === 'däggdjur')) &&
                  selectedDate >= row.start && selectedDate <= row.end)
                .map((row, idx) => (
                  <JakttidRow key={idx} art={row.art} info={row.info} tider={row.tider} />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default App
