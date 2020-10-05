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

const GITHUB_GRAPHQL_QUERY = `
  query getIssues($organization: String!, $repository: String!){
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
      }
    }
  }
`

const fetchDataFromGithub = (organization, repository) => {
  return GITHUB_AXIOS_CLIENT.post('', {
    query: GITHUB_GRAPHQL_QUERY,
    variables: { organization, repository }
  })
}

const App = () => {
  const [url, setUrl] = useState('google/tink')
  const [organization, setOrganization] = useState(null)
  const [errors, setErrors] = useState(null)

  const fetchAndUpdateOrganization = async () => {
    const [ org, repo ] = url.split('/')
    const result = await fetchDataFromGithub(org, repo)
    console.log(result)
    setErrors(result?.data?.errors)
    setOrganization(result?.data?.data?.organization)
  }

  useEffect(() => {
    fetchAndUpdateOrganization()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderOrganization = () => {
    if (errors) {
      return (
        <div>
          <h2>Failed to fetch issues from Github.</h2>
          <ul>
            {errors.map((error, index) => <li key={index}>{error.message}</li>)}
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
    await fetchAndUpdateOrganization()
  }

  const onChange = (event) => {
    setUrl(event.target.value)
  }
  return (
    <div>
      <h1>{TITLE}</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="urlInput">https://github.com/</label>
        <input 
          id="urlInput" 
          type="text"
          onChange={onChange}
          value={url}
          />
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
      <Repository repository={organization.repository}/>
    </div>
  )
}

const Repository = ({ repository }) => {
  return (
    <div>
      <p>
        <strong>Repository: </strong>
        <a href={repository.url}>{repository.name}</a>
      </p>
    </div>
  )
}

export default App