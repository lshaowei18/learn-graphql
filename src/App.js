import React, { useEffect, useState } from 'react'
import axios from 'axios'

require('dotenv').config()

const TITLE = 'React Graphql Github Client'

const GITHUB_AXIOS_CLIENT = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_TOKEN}`
  }
})

const GET_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
    }
  }
`

const fetchDataFromGithub = () => {
  return GITHUB_AXIOS_CLIENT.post('', {
    query: GET_ORGANIZATION
  })
}

// Get token from env var and create axios client
// Create react component
// Make graphql call
const App = () => {

  const [organization, setOrganization] = useState(null)
  const [errors, setErrors] = useState(null)

  const fetchAndUpdateOrganization = async () => {
    const result = await fetchDataFromGithub()
    setErrors(result.data.errors)
    setOrganization(result.data.data.organization)
  }

  useEffect(() => {
    fetchAndUpdateOrganization()
  }, [])

  const renderOrganization = () => {
    if (errors) {
      return (
        <div>
          <h2>Failed to fetch issues from Github.</h2>
          <ul>
            {errors.map(error => <li>{error.message}</li>)}
          </ul>
        </div>
      )
    }
    if (organization) {
      return <Organization organization={organization}/>
    }
    return 'Loading...'
  }
  
  const onSubmit = async (event) => {
    event.preventDefault()
    await fetchDataFromGithub('hi')
  }
  return (
    <div>
      <h1>{TITLE}</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="urlInput">https://github.com/</label>
        <input id="urlInput" type="text"/>
        <input type="submit" value="Submit"/>
      </form>
      {renderOrganization()}
    </div>
  )
}

const Organization = ({ organization }) => {
  return (
    <div>
      <h2>Issues from</h2>
      <p>
        <strong>Organization: </strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
    </div>
  )
}

export default App