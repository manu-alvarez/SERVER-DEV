export async function createTrelloCard(name: string, description: string): Promise<boolean> {
  const apiKey = import.meta.env.VITE_TRELLO_API_KEY
  const token = import.meta.env.VITE_TRELLO_TOKEN
  const listId = import.meta.env.VITE_TRELLO_LIST_ID

  if (!apiKey || !token || !listId) {
    console.warn('Trello credentials or list ID are missing from environment variables')
    return false
  }

  try {
    const url = new URL('https://api.trello.com/1/cards')
    url.searchParams.append('key', apiKey)
    url.searchParams.append('token', token)
    url.searchParams.append('idList', listId)
    url.searchParams.append('name', name)
    url.searchParams.append('desc', description)
    url.searchParams.append('pos', 'top')

    const response = await fetch(url.toString(), {
      method: 'POST',
    })

    if (!response.ok) {
      console.error('Failed to create Trello card:', response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error creating Trello card:', error)
    return false
  }
}
