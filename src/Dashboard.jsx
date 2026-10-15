import { useEffect, useState } from 'react'
import supabase from './supabase'

function Dashboard() {

  const [selectedMinistry, setSelectedMinistry] =
    useState('')

  const [selectedYear, setSelectedYear] =
    useState(new Date().getFullYear())

  const [groups, setGroups] = useState([])
   
  const [meetings, setMeetings] = useState([])
    
    const [attendanceRows, setAttendanceRows] = useState([])
    const [visitorRows, setVisitorRows] = useState([])
    useEffect(() => {
        loadGroups() 
        loadMeetings() 
        loadAttendance()
        loadVisitors() 
    }, [])

    const monthHeaders = []

for (let i = 5; i >= 0; i--) {
  const date = new Date()

  date.setMonth(date.getMonth() - i)

  monthHeaders.push({
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    label: date.toLocaleString('en-GB', {
      month: 'short'
    })
  })
}
  
    async function loadVisitors() {
  const { data } = await supabase
    .from('visitors')
    .select('*')

  setVisitorRows(data || [])
}

async function loadAttendance() {
  const { data } = await supabase
    .from('attendance')
    .select('*')

  setAttendanceRows(data || [])
}

  async function loadMeetings() {
  const { data } = await supabase
    .from('meetings')
    .select('*')

  setMeetings(data || [])
}
  async function loadGroups() {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('group_name')

    setGroups(data || [])
  }

  const filteredGroups =
    groups.filter(
      group =>
        group.ministry === selectedMinistry
    )

    const ministryMeetings =
  meetings.filter(meeting => {

    const group = groups.find(
      g =>
        String(g.id) ===
        String(meeting.group_id)
    )

    return (
      group?.ministry ===
      selectedMinistry
    )
  })

  
const totalOffering =
  ministryMeetings.reduce(
    (sum, meeting) =>
      sum + Number(meeting.offering || 0),
    0
  )

const totalAttendance =
  attendanceRows.filter(row =>
    ministryMeetings.some(
      meeting =>
        Number(meeting.id) ===
        Number(row.meeting_id)
    )
  ).length

const totalVisitors =
  visitorRows.filter(row =>
    ministryMeetings.some(
      meeting =>
        Number(meeting.id) ===
        Number(row.meeting_id)
    )
  ).length

  return (
    <div>

      <h1>Monthly Overview Dashboard</h1>

      <div className="card">

        <label>
          Ministry
        </label>

        <select
          value={selectedMinistry}
          onChange={(e) =>
            setSelectedMinistry(e.target.value)
          }
        >
          <option value="">
            Select Ministry
          </option>

          <option value="English">
            English
          </option>

          <option value="Chinese">
            Chinese
          </option>
        </select>

        <br />
        <br />

        </div>

      <br />
      <div
  style={{    display: 'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',marginBottom: '20px'  }}
>

  <div className="card">
    <h4>Groups</h4>

    <p>{filteredGroups.length}</p>
  </div>

  <div className="card">
    <h4>Meetings</h4>

    <p>{ministryMeetings.length}</p>
  </div>

  <div className="card">
    <h4>Attendance</h4>

    <p>{totalAttendance}</p>
  </div>

  <div className="card">
    <h4>Visitors</h4>

    <p>{totalVisitors}</p>
  </div>

  <div className="card">
    <h4>Offering</h4>

    <p>RM {totalOffering.toFixed(2)}</p>
  </div>

</div>
      <div className="card">

        <h3>Groups</h3>

       
       <div
  style={{
    overflowX: 'auto'
  }}
><table
  style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px'}}
>
          <thead>
           <tr>
  <th
    style={{
      textAlign: 'left',
      minWidth: '220px'
    }}
  >
    Group
  </th>

  {monthHeaders.map(header => (
    <th
      key={`${header.month}-${header.year}`}
      style={{ minWidth: '180px' }}
    >
      {header.label}
    </th>
  ))}
</tr>
          </thead>

        <tbody>
  {filteredGroups.map(group => (
    <tr key={group.id}>

      <td
        style={{
          minWidth: '220px',
          padding: '8px',
          verticalAlign: 'top',
          fontWeight: 'bold'
        }}
      >
        {group.group_name}
      </td>
                
        {monthHeaders.map(header => {

  const meetingsForMonth =
    meetings.filter(meeting => {

      const date =
        new Date(meeting.meeting_date)

        const attendanceCount =
  attendanceRows.filter(
    row => row.meeting_id === meeting.id
  ).length
  
      return (
        String(meeting.group_id) ===
          String(group.id)
        &&
        date.getMonth() + 1 ===
          header.month
        &&
        date.getFullYear() ===
          header.year
      )
    })

  return (
    <td
      key={`${group.id}-${header.month}`}
      style={{
        verticalAlign: 'top'
      }}
    >
      {meetingsForMonth.length === 0
        ? <span
  style={{
    color: '#dc2626',
    fontStyle: 'italic'
  }}
>
  No Meeting
</span>
        : meetingsForMonth.map(meeting => {

  const members =
    attendanceRows.filter(
      row =>
        Number(row.meeting_id) ===
        Number(meeting.id)
    ).length

  const visitors =
    visitorRows.filter(
      row =>
        Number(row.meeting_id) ===
        Number(meeting.id)
    ).length

  return (
    <div
      key={meeting.id}
      style={{background: '#f8fafc',border: '1px solid #e5e7eb',
    padding: '8px',borderRadius: '8px',marginBottom: '8px',
    fontSize: '13px'}}
    >
      <div>
        {new Date(
          meeting.meeting_date
        ).toLocaleDateString(
          'en-GB',
          {
            day: '2-digit',
            month: '2-digit'
          }
        )}
      </div>
      <div>
          Members: {members}
      </div>
      <div>
          Visitors: {visitors}
      </div>

      <div>
        RM {Number(meeting.offering || 0).toFixed(2)}
      </div>
    </div>
  )
})

          
      }
    </td>
  )
})}
                
              </tr>
            ))}
          </tbody>

        </table></div>

      </div>

    </div>
    
  )
}

export default Dashboard



