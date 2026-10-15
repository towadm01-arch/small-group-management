async function deleteMember(memberId) {

  const confirmed =
    window.confirm(
      'Delete this member?'
    )

  if (!confirmed) return

  await supabase
    .from('members')
    .delete()
    .eq('id', memberId)

  loadMembers()
}

<button
  onClick={() =>
    deleteMember(member.id)
  }
>
  Delete
</button>