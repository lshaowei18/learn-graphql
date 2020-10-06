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

const GITHUB_FETCH_ISSUE_QUERY = `
  query getIssues($organization: String!, $repository: String!, $cursor: String){
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        id
        name
        url
        viewerHasStarred
        stargazers {
          totalCount
        }
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

const GITHUB_ADD_STAR_QUERY = `
  mutation ($repositoryId: ID!) {
    addStar(input: {starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`

const GITHUB_REMOVE_STAR_QUERY = `
  mutation ($repositoryId: ID!) {
    removeStar(input: {starrableId:$repositoryId}) {
      starrable {
        viewerHasStarred
      }
    }
  }
`

const addStarToRepository = (repositoryId) => {
  return GITHUB_AXIOS_CLIENT.post('', {
    query: GITHUB_ADD_STAR_QUERY,
    variables: { repositoryId }
  })
}

const removeStarFromRepository = (repositoryId) => {
  return GITHUB_AXIOS_CLIENT.post('', {
    query: GITHUB_REMOVE_STAR_QUERY,
    variables: { repositoryId }
  })
}

const fetchIssuesFromGithub = (organization, repository, cursor) => {
  return GITHUB_AXIOS_CLIENT.post('', {
    query: GITHUB_FETCH_ISSUE_QUERY,
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

  const resolveStarMutation = (viewerHasStarred) => {
    
    setOrganization({
      ...organization,
      repository: {
        ...organization.repository,
        viewerHasStarred,
        stargazers: {
          totalCount: viewerHasStarred ? 
            organization.repository.stargazers.totalCount + 1 : 
            organization.repository.stargazers.totalCount - 1
        }
      }
    })
  }

  const onStarRepository = async () => {
    // Has starred, removing star now
    if (organization.repository.viewerHasStarred) {
      const result = await removeStarFromRepository(organization.repository.id)
      resolveStarMutation(result.data.data.removeStar.starrable.viewerHasStarred)
    }
    else {
      const result = await addStarToRepository(organization.repository.id)
      resolveStarMutation(result.data.data.addStar.starrable.viewerHasStarred)
    }
    
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
      return <Organization 
        organization={organization} 
        onFetchMoreIssues={onFetchMoreIssues}
        onStarRepository={onStarRepository}/>
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

const Organization = ({ organization, onFetchMoreIssues, onStarRepository }) => {
  return (
    <div>
      <h2>Issues from</h2>
      <p>
        <strong>Organization: </strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
      <Repository 
        repository={organization.repository} 
        onFetchMoreIssues={onFetchMoreIssues}
        onStarRepository={onStarRepository}
        />
    </div>
  )
}

const Repository = ({ repository, onFetchMoreIssues, onStarRepository }) => {
  return (
    <div>
      <p>
        <strong>Repository: </strong>
        <a href={repository.url}>{repository.name}</a>
      </p>
      <p>
        Number of stargazers: {repository.stargazers.totalCount}
      </p>
      <button onClick={onStarRepository}>
        {repository.viewerHasStarred ? "Unstar" : "Star"}
      </button>
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