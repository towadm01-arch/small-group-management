import { useEffect, useState } from 'react'
import supabase from './supabase'
import './App.css'
import { jsPDF } from 'jspdf'
import Dashboard from './Dashboard'

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

  const [reports, setReports] = useState([])

  const [selectedReport, setSelectedReport] = useState(null)
  const [showReports, setShowReports] = useState(false)

  const [page, setPage] = useState('form')
  const [dashboardPassword, setDashboardPassword] =
  useState('')
  const [dashboardUnlocked, setDashboardUnlocked] =
  useState(false)
  
    async function loadReports(groupId) {

  if (!groupId) {
    setReports([])
    return
  }
  

  const { data } = await supabase
    .from('meetings')
    .select('*')
    .eq('group_id', groupId)
    .order('meeting_date', {
      ascending: false
    })
    .limit(4)

  setReports(data || [])
}

useEffect(() => {
  loadGroups()
}, [])

  async function addVisitorToMembers(
  visitorName
) {

  const { data: existingMember } =
    await supabase
      .from('members')
      .select('id')
      .eq('group_id', selectedGroup)
      .eq('member_name', visitorName)
      .maybeSingle()

  if (existingMember) {
    alert('Member already exists')
    return
  }

  const { error } =
    await supabase
      .from('members')
      .insert([
        {
          group_id: selectedGroup,
          member_name: visitorName
        }
      ])

  if (!error) {

    alert(
      `${visitorName} added to members`
    )

    await loadGroup(selectedGroup)

setVisitors(
  visitors.filter(
    v => v !== visitorName
  )
)
  }
}
async function deleteMember(
  memberId,
  memberName
) {

  const confirmed = window.confirm(
    `Delete ${memberName}?`
  )

  if (!confirmed) return

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId)

  if (error) {
    alert('Failed to delete member')
    return
  }

  await loadGroup(selectedGroup)

  setSaveMessage(
    `✅ ${memberName} removed`
  )
}
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

    loadReports(groupId)

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

  async function downloadReport(meetingId) {

  const { data: meeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', meetingId)
    .single()

  const { data: attendanceRows } = await supabase
    .from('attendance')
    .select(`
      *,
      members (
        member_name
      )
    `)
    .eq('meeting_id', meetingId)

  const { data: visitorRows } = await supabase
    .from('visitors')
    .select('*')
    .eq('meeting_id', meetingId)

  const groupName =
    groups.find(
      (g) =>
        String(g.id) === String(meeting.group_id)
    )?.group_name || ''

  const formattedDate =
    new Date(meeting.meeting_date)
      .toLocaleDateString('en-GB')

  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(
    'SMALL GROUP MEETING REPORT',
    20,
    20
  )

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  let y = 40

  doc.text('Group', 20, y)
  doc.text(':', 55, y)
  doc.text(groupName, 60, y)

  y += 7

  doc.text('Meeting Date', 20, y)
  doc.text(':', 55, y)
  doc.text(formattedDate, 60, y)

  y += 7

  doc.text('Lesson', 20, y)
  doc.text(':', 55, y)
  doc.text(meeting.lesson || '', 60, y)

  y += 7

  doc.text('Host', 20, y)
  doc.text(':', 55, y)
  doc.text(meeting.host || '', 60, y)

  y += 7

  doc.text('Teacher', 20, y)
  doc.text(':', 55, y)
  doc.text(meeting.teacher || '', 60, y)

  y += 15

  doc.setFont('helvetica', 'bold')
  doc.text('ATTENDANCE', 20, y)
  doc.setFont('helvetica', 'normal')

  y += 8

  attendanceRows?.forEach((row) => {
    doc.text(
      `• ${row.members?.member_name || ''}`,
      25,
      y
    )
    y += 8
  })

  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text('VISITORS', 20, y)
  doc.setFont('helvetica', 'normal')

  y += 8

  visitorRows?.forEach((row) => {
    doc.text(
      `• ${row.visitor_name}`,
      25,
      y
    )
    y += 8
  })

  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text('OFFERING', 20, y)
  doc.setFont('helvetica', 'normal')

  y += 8

  doc.text(
    `Amount: RM ${Number(
      meeting.offering || 0
    ).toFixed(2)}`,
    25,
    y
  )

  y += 8

  doc.text(
    `Counter 1: ${meeting.counter_1 || ''}`,
    25,
    y
  )

  y += 8

  doc.text(
    `Counter 2: ${meeting.counter_2 || ''}`,
    25,
    y
  )

  y += 12

  doc.setFont('helvetica', 'bold')
  doc.text('Prepared By', 20, y)

  doc.setFont('helvetica', 'normal')
  doc.text(':', 55, y)
  doc.text(
    meeting.prepared_by || '',
    60,
    y
  )

  doc.save(
    `SmallGroupReport-${meeting.meeting_date}.pdf`
  )
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
    const { data: existingMeetings } =
  await supabase
    .from('meetings')
    .select('id')
    .eq(
      'group_id',
      Number(selectedGroup)
    )
    .eq(
      'meeting_date',
      meetingDate
    )

if (
  existingMeetings &&
  existingMeetings.length > 0
) {
  setSaveMessage(
    '⚠ Report already exists for this group and date'
  )
  return
}

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

    loadReports(selectedGroup)
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
   

} catch (error) {
  console.error(error)

  setSaveMessage(
    '❌ Failed to Save Report: ' +
    error.message
  )
}
}
function exportPdf() {
  const doc = new jsPDF()
  const groupName =
  groups.find(
    (g) => String(g.id) === String(selectedGroup)
  )?.group_name || ''
  const formattedDate =
  meetingDate
    ? new Date(meetingDate)
        .toLocaleDateString('en-GB')
    : ''

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('SMALL GROUP MEETING REPORT', 20, 20)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  doc.text('Ministry', 20, 40)
    doc.text(':', 55, 40)
    doc.text(selectedMinistry, 60, 40)
  doc.text('Group', 20, 47)
    doc.text(':', 55, 47)
    doc.text(groupName, 60, 47)
  doc.text('Meeting Date', 20, 54)
    doc.text(':', 55, 54)
    doc.text(formattedDate, 60, 54)

  doc.text('Lesson', 20, 64)
    doc.text(':', 55, 64)
    doc.text(lesson, 60, 64)

  doc.text('Host', 20, 71)
    doc.text(':', 55, 71)
    doc.text(host, 60, 71)

  doc.text('Teacher', 20, 78)
    doc.text(':', 55, 78)
    doc.text(teacher, 60, 78)

  doc.setFont('helvetica', 'bold')
  doc.text('ATTENDANCE', 20, 95)
  doc.setFont('helvetica', 'normal')
  let y = 100

  members.forEach((member) => {
    if (attendance[member.id]) {
      doc.setFont('helvetica', 'normal')
      doc.text(`• ${member.member_name}`, 25, y)
      y += 8
    }
  })

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text('VISITORS', 20, y)
  doc.setFont('helvetica', 'normal')
  y += 5

  visitors.forEach((visitor) => {
    doc.text(`• ${visitor}`, 25, y)
    y += 8
  })
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text('OFFERING', 20, y)
  doc.setFont('helvetica', 'normal')
  y += 8

  doc.text(`Amount: RM ${Number(offering || 0).toFixed(2)}`, 25, y )
  y += 8

  doc.text(`Counter 1: ${counter1}`, 25, y)
  y += 8

  doc.text(`Counter 2: ${counter2}`, 25, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.text('SUMMARY', 20, y)
  doc.setFont('helvetica', 'normal')
  y += 8

  doc.text(`Members Present: ${membersPresent}`,  25,  y)
  y += 8

  doc.text( `Visitors Present: ${visitorCount}`,  25,  y)
  y += 8

  doc.text( `Total Attendance: ${totalAttendance}`,  25,  y)
 
  y += 12
  doc.setFont('helvetica', 'bold')
    doc.text('Prepared By', 20, y)
  doc.setFont('helvetica', 'normal')
    doc.text(':', 55, y)
    doc.text(preparedBy, 60, y)

  doc.save( `SmallGroupReport-${meetingDate}.pdf` )

 
}

  return (
    <div className="container">
      <div
  style={{
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  }}
>
  <button
    className="toggle-button"
    onClick={() => {
  setPage('form')
  setDashboardUnlocked(false)
}}
  >
    Attendance Entry
  </button>

  <button
    className="toggle-button"
    onClick={() => setPage('dashboard')}
  >
    Dashboard
  </button>
</div>

{page === 'dashboard' ? (

  dashboardUnlocked ? (

    <Dashboard />

  ) : (

    <div className="card">

      <h2>Dashboard Access</h2>

      <input
        type="password"
        placeholder="Enter password"
        value={dashboardPassword}
        onChange={(e) =>
          setDashboardPassword(e.target.value)
        }
      />

      <br />
      <br />

      <button
        onClick={() => {

          if (
            dashboardPassword ===
              import.meta.env.VITE_DASHBOARD_PASSWORD
          ) {
            setDashboardUnlocked(true)
          } else {
            alert('Invalid Password')
          }

        }}
      >
        Access Dashboard
      </button>

    </div>

  )

) : (
  <>

<div style={{background: '#1f6f50',color: 'white',padding: '20px',borderRadius: '10px',marginBottom: '20px'}}>
  <h1>Small Group Attendance Report</h1>
  <p>Tabernacle of Worship</p>
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

<section>
<div className="card">
<h2>Meeting Details</h2>

<div>
  <label>Meeting Date</label>
  <br />
  <input
  type="date"
  value={meetingDate}
  onChange={(e) => setMeetingDate(e.target.value)}

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
  onChange={(e) => setHost(e.target.value)
  }
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

/>
</div></div>
</section>

<br />



<hr />

<h2>Attendance</h2>
{members.map(member => (
  <div
  key={member.id}
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  }}
>
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}
  >
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

    <span>
      {member.member_name}
    </span>
  </div>

  <button
    type="button"
    onClick={() =>
      deleteMember(
        member.id,
        member.member_name
      )
    }
    style={{
      background: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '6px 10px',
      cursor: 'pointer'
    }}
  >
    Delete
  </button>
</div>
))}
<hr />
<section>
<div className="card">
<h2>Visitors</h2>

<div
  style={{
    display: 'flex',
    gap: '10px'
  }}
>
  <input
    type="text"
    placeholder="Visitor Name"
    value={visitorName}
    onChange={(e) =>
      setVisitorName(e.target.value)
    }
    style={{
      flex: 1
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
    style={{
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      padding: '10px 16px',
      cursor: 'pointer',
      fontWeight: 'bold'
    }}
  >
    Add
  </button>
</div>

<ul style={{
  listStyle: 'none',
  padding: 0
}}>
  {visitors.map((visitor, index) => (
    <li
      key={index}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}
    >
      <span>
        {visitor}
      </span>

      <div
        style={{
          display: 'flex',
          gap: '8px'
        }}
      >
        <button
          type="button"
          onClick={() =>
            addVisitorToMembers(visitor)
          }
          style={{
            background: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer'
          }}
        >
          Add Member
        </button>

        <button
          type="button"
          onClick={() => {
            setVisitors(
              visitors.filter(
                (_, i) => i !== index
              )
            )
          }}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 10px',
            cursor: 'pointer'
          }}
        >
          Remove
        </button>
      </div>
    </li>
  ))}
</ul>
</div>
</section>
<hr />

<section>
<div className="card">
<h2>Offering</h2>

<div>
  <label>Amount (RM)</label>
  <br />
  <input
  type="number"
  step="0.01"
  placeholder="0.00"
  value={offering}
  onChange={(e) => setOffering(e.target.value)}

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

/>

</div></div>
</section>

<hr />

<div
  style={{
    background: '#f3f4f6',
   
  }}
>

<section>
<div className="card">
  <h2>Summary</h2>

  <p>Members Present: {membersPresent}</p>
  <p>Visitors Present: {visitorCount}</p>
  <p>Total Attendance: {totalAttendance}</p>
</div>
</section></div>
<hr />

<section>
<div className="card">
<h2>Prepared By</h2>

<input
  type="text"
  placeholder="Prepared By"
  value={preparedBy}
  onChange={(e) => setPreparedBy(e.target.value)}
/>

<div
  style={{display: 'flex',gap: '10px',marginTop: '10px'}}
>

  <button
    type="button"
    onClick={saveReport}
    style={{flex: 1,background: '#16a34a',color: 'white',padding: '12px',    border: 'none',
    borderRadius: '8px',cursor: 'pointer',fontWeight: 'bold'}}
  >
    Save Report
  </button>

  <button
    type="button"
    onClick={exportPdf}
    style={{flex: 1,background: '#1d4ed8',color: 'white',padding: '12px',    border: 'none',
    borderRadius: '8px',cursor: 'pointer',fontWeight: 'bold'}}
  >
    Export PDF
  </button>
  
</div>

{saveMessage && (
  <div
    style={{marginTop: '15px',color: 'green',fontWeight: 'bold',
      textAlign: 'center'}}
  >
    {saveMessage}
  </div>
)}   
</div>
</section>   

{selectedReport && (
  <section>
    <div className="card">
      <h2>Report Details</h2>

      <p>
        Date:
        {' '}
        {selectedReport.meeting_date}
      </p>

      <p>
        Lesson:
        {' '}
        {selectedReport.lesson}
      </p>

      <p>
        Host:
        {' '}
        {selectedReport.host}
      </p>

      <p>
        Teacher:
        {' '}
        {selectedReport.teacher}
      </p>

      <p>
        Offering:
        {' '}
        RM
        {Number(
          selectedReport.offering || 0
        ).toFixed(2)}
      </p>

      <p>
        Prepared By:
        {' '}
        {selectedReport.prepared_by}
      </p>
    </div>
  </section>
)}
<button
  className="toggle-button"
  disabled={!selectedGroup}
  type="button"
  onClick={() => {
    setShowReports(!showReports)

    if (!showReports) {
      loadReports(selectedGroup)
    }
  }}
>
{showReports
  ? '📂 Hide Past Reports'
  : '📄 View Past Reports'}
</button>

{showReports && (

<section>
  <div className="card">
    <h2>Past Reports</h2>

    {reports.map((report) => (
      <div
  key={report.id}
  style={{display: 'flex',justifyContent: 'space-between',alignItems: 'center',padding: '10px 0'}}
>
<div>
  <strong>
    {new Date(report.meeting_date)
      .toLocaleDateString('en-GB')}
  </strong>

  <br />

  {report.lesson}
</div>

<button
  type="button"
  onClick={() =>
    downloadReport(report.id)
  }
  className="download-button"
>
  Download PDF
</button>
        <hr />
      </div>
    ))}
  </div>
</section>

)}
 </>
)}
    </div>
  )
}

export default App