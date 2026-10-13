import { useEffect, useState } from 'react'
import supabase from './supabase'

function App() {
  
  const [groups, setGroups] = useState([])
  const [ministries, setMinistries] = useState([])

  const [selectedMinistry, setSelectedMinistry] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')

  const [leaders, setLeaders] = useState([])
  const [members, setMembers] = useState([])
  
  const [visitorName, setVisitorName] = useState('')
  const [visitors, setVisitors] = useState([])
  const [attendance, setAttendance] = useState({})

  const [meetingDate, setMeetingDate] = useState('')
  const [lesson, setLesson] = useState('')
  const [host, setHost] = useState('')
  const [teacher, setTeacher] = useState('')
  const [preparedBy, setPreparedBy] = useState('')
  const [offering, setOffering] = useState('')
  const [counter1, setCounter1] = useState('')
  const [counter2, setCounter2] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .order('group_name')

    const groupData = data || []

    setGroups(groupData)

    const uniqueMinistries = [
      ...new Set(groupData.map(g => g.ministry))
    ]

    setMinistries(uniqueMinistries)
  }

  async function loadGroup(groupId) {
    setSelectedGroup(groupId)

    const { data: leaderData } = await supabase
      .from('group_leaders')
      .select('*')
      .eq('group_id', groupId)

    setLeaders(leaderData || [])

    const { data: memberData } = await supabase
      .from('members')
      .select('*')
      .eq('group_id', groupId)
      .order('member_name')

    setMembers(memberData || [])
  }

  const filteredGroups = groups.filter(
    g => g.ministry === selectedMinistry
  )
const membersPresent =
  Object.values(attendance).filter(Boolean).length

const visitorCount = visitors.length

const totalAttendance =
  membersPresent + visitorCount
  async function saveReport() {

  if (!selectedGroup) {
    setSaveMessage('❌ Please select a group')
    return
  }

  if (!meetingDate) {
    setSaveMessage('❌ Please enter meeting date')
    return
  }

  if (!lesson.trim()) {
    setSaveMessage('❌ Please enter lesson/topic')
    return
  }

  if (membersPresent === 0 && visitorCount === 0) {
    setSaveMessage('❌ Attendance cannot be zero')
    return
  }

  if (!window.confirm('Save this meeting report?')) {
    return
  }

  try {
    setSaveMessage('Saving...')


    const { data: meetingData, error: meetingError } =
      await supabase
        .from('meetings')
        .insert([
          {
            group_id: selectedGroup,
            meeting_date: meetingDate,
            lesson: lesson,
            host: host,
            teacher: teacher,
            prepared_by: preparedBy,
            offering: offering,
            counter_1: counter1,
            counter_2: counter2
          }
        ])
        .select()

    if (meetingError) throw meetingError

    const meetingId = meetingData[0].id

    const attendanceRows = Object.entries(attendance)
      .filter(([_, present]) => present)
      .map(([memberId]) => ({
        meeting_id: meetingId,
        member_id: memberId,
        present: true
      }))

    if (attendanceRows.length > 0) {
      const { error: attendanceError } =
        await supabase
          .from('attendance')
          .insert(attendanceRows)

      if (attendanceError) throw attendanceError
    }

    const visitorRows = visitors.map(visitor => ({
      meeting_id: meetingId,
      visitor_name: visitor
    }))

    if (visitorRows.length > 0) {
      const { error: visitorError } =
        await supabase
          .from('visitors')
          .insert(visitorRows)

      if (visitorError) throw visitorError
    }

    setSaveMessage('✅ Report Saved Successfully')
    setMeetingDate('')
    setLesson('')
    setHost('')
    setTeacher('')
    setPreparedBy('')
    setOffering('')
    setCounter1('')
    setCounter2('')

    setAttendance({})
    setVisitors([])
    setVisitorName('')
    alert('✅ Report Saved Successfully')

} catch (error) {
  console.error(error)

  setSaveMessage(
    '❌ Failed to Save Report: ' +
    error.message
  )
}
}
  return (
    <div style={{ padding: '20px' }}>
      <div
  style={{
    background: '#2563eb',
    color: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px'
  }}
>
  <h1>Small Group Attendance Report</h1>
  <p>
    Tabernacle of Worship
  </p>
</div>

<div>
  <label>Ministry</label>
  <br />

  <select
    value={selectedMinistry}
    onChange={(e) => {
      setSelectedMinistry(e.target.value)
      setSelectedGroup('')
      setLeaders([])
      setMembers([])
      setAttendance({})
    }}
    style={{
      width: '100%',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      background: 'white',
      fontSize: '16px'
    }}
  >
    <option value="">Select Ministry</option>

    {ministries.map((ministry) => (
      <option key={ministry} value={ministry}>
        {ministry}
      </option>
    ))}
  </select>
</div>

<br />

<div>
  <label>Small Group</label>
  <br />

  <select
    value={selectedGroup}
    onChange={(e) => {
      setAttendance({})
      loadGroup(e.target.value)
    }}
    disabled={!selectedMinistry}
    style={{
      width: '100%',
      padding: '10px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      background: selectedMinistry ? 'white' : '#e5e7eb',
      fontSize: '16px',
      cursor: selectedMinistry ? 'pointer' : 'not-allowed'
    }}
  >
    <option value="">
      {selectedMinistry
        ? 'Select Small Group'
        : 'Select Ministry First'}
    </option>

    {filteredGroups.map((group) => (
      <option key={group.id} value={group.id}>
        {group.group_name}
      </option>
    ))}
  </select>
</div>

<h2>Group Leaders</h2>

<ul>
  {leaders.map((leader) => (
    <li key={leader.id}>
      {leader.leader_name}
    </li>
  ))}
</ul>

<hr />

<h2>Meeting Details</h2>

<div>
  <label>Meeting Date</label>
  <br />
  <input
  type="date"
  value={meetingDate}
  onChange={(e) => setMeetingDate(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>
</div>

<br />

<div>
  <label>Lesson</label>
  <br />
  <input
  type="text"
  placeholder="Lesson / Topic"
  value={lesson}
  onChange={(e) => setLesson(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>
</div>

<br />

<div>
  <label>Host</label>
  <br />
 <input
  type="text"
  placeholder="Host"
  value={host}
  onChange={(e) => setHost(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>
</div>

<br />

<div>
  <label>Teacher</label>
  <br />
 <input
  type="text"
  placeholder="Teacher"
  value={teacher}
  onChange={(e) => setTeacher(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>
</div>

<br />



<hr />

<h2>Attendance</h2>
{members.map(member => (
  <div key={member.id}>
    <label>
      <input
        type="checkbox"
        checked={attendance[member.id] || false}
        onChange={(e) =>
          setAttendance({
            ...attendance,
            [member.id]: e.target.checked
          })
        }
      />
      {' '}
      {member.member_name}
      {' '}
      ({member.member_status})
    </label>
  </div>
))}
<hr />

<h2>Visitors</h2>

<input
  type="text"
  placeholder="Visitor Name"
  value={visitorName}
  onChange={(e) => setVisitorName(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>

<button
  type="button"
  onClick={() => {
    if (!visitorName.trim()) return

    setVisitors([
      ...visitors,
      visitorName
    ])

    setVisitorName('')
  }}
>
  Add Visitor
</button>

<ul>
  {visitors.map((visitor, index) => (
    <li key={index}>
      {visitor}

      <button
        type="button"
        onClick={() => {
          setVisitors(
            visitors.filter((_, i) => i !== index)
          )
        }}
      >
        Remove
      </button>
    </li>
  ))}
</ul>

<hr />

<h2>Offering</h2>

<div>
  <label>Offering Amount (RM)</label>
  <br />
  <input
  type="number"
  step="0.01"
  placeholder="0.00"
  value={offering}
  onChange={(e) => setOffering(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>
</div>

<br />

<div>
  <label>Counter 1</label>
  <br />
  <input
  type="text"
  placeholder="Counter 1"
  value={counter1}
  onChange={(e) => setCounter1(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>
</div>

<br />

<div>
  <label>Counter 2</label>
  <br />
 <input
  type="text"
  placeholder="Counter 2"
  value={counter2}
  onChange={(e) => setCounter2(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>

</div>

<hr />

<div
  style={{
    background: '#f3f4f6',
    padding: '15px',
    borderRadius: '10px'
  }}
>
  <h2>Summary</h2>

  <p>Members Present: {membersPresent}</p>
  <p>Visitors Present: {visitorCount}</p>
  <p>Total Attendance: {totalAttendance}</p>
</div>
<hr />

<h2>Prepared By</h2>

<input
  type="text"
  placeholder="Prepared By"
  value={preparedBy}
  onChange={(e) => setPreparedBy(e.target.value)}
  style={{
  width: '100%',
  padding: '10px',
  borderRadius: '6px'
}}
/>

<br />
<br />
<button
  type="button"
  onClick={saveReport}
  style={{
    background: '#16a34a',
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }}
>
  Save Report
</button>
<div
  style={{
    marginTop: '10px',
    color: 'green',
    fontWeight: 'bold'
  }}
>
  {saveMessage}
</div>

      
    </div>
  )
}

export default App