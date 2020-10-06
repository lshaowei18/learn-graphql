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
  query getIssues($organization: String!, $repository: String!, $cursor: String){
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`

const fetchIssuesFromGithub = (organization, repository, cursor) => {
  return GITHUB_AXIOS_CLIENT.post('', {
    query: GITHUB_GRAPHQL_QUERY,
    variables: { organization, repository, cursor }
  })
}

const App = () => {
  const [url, setUrl] = useState('google/tink')
  const [organization, setOrganization] = useState(null)
  const [errors, setErrors] = useState(null)

  const resolveIssueQuery = (queryResult, cursor) => {
    const { data, errors } = queryResult?.data
    if (!cursor) {
      setErrors(errors)
      setOrganization(data?.organization)
      return
    }
    const oldIssues = organization.repository.issues.edges
    const newIssues = data?.organization?.repository?.issues?.edges
    const updatedIssues = [...oldIssues, ...newIssues]

    setOrganization({
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues,
        }
      }
    })
    setErrors(errors)
  }

  const fetchAndUpdateOrganization = async () => {
    const [ org, repo ] = url.split('/')
    const result = await fetchIssuesFromGithub(org, repo)
    console.log(result)
    resolveIssueQuery(result)
  }

  const onFetchMoreIssues = async () => {
    const cursor = organization.repository.issues.pageInfo.endCursor
    const result = await fetchIssuesFromGithub(
      organization.name,
      organization.repository.name,
      cursor)
    resolveIssueQuery(result, cursor)
  }

  useEffect(() => {
    fetchAndUpdateOrganization()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderOrganization = () => {
    if (!errors && !organization) {
      return <h2>Loading...</h2>
    }
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

    if (!organization?.repository) {
      return <h2>Failed to find repository.</h2>
    }

    if (organization) {
      return <Organization organization={organization} onFetchMoreIssues={onFetchMoreIssues}/>
    }
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

const Organization = ({ organization, onFetchMoreIssues }) => {
  return (
    <div>
      <h2>Issues from</h2>
      <p>
        <strong>Organization: </strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
      <Repository repository={organization.repository} onFetchMoreIssues={onFetchMoreIssues}/>
    </div>
  )
}

const Repository = ({ repository, onFetchMoreIssues }) => {
  return (
    <div>
      <p>
        <strong>Repository: </strong>
        <a href={repository.url}>{repository.name}</a>
      </p>
      <ul>
        {repository.issues.edges.map(issue => (
          <li key={issue.node.id}>
            <a href={issue.node.url}>{issue.node.title}</a>
          </li>
        ))}
      </ul>
      {repository.issues.pageInfo.hasNextPage && <button onClick={onFetchMoreIssues}>More</button>}
    </div>
  )
}

export default App