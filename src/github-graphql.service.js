import axios from 'axios'

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

export {
    addStarToRepository,
    removeStarFromRepository,
    fetchIssuesFromGithub,
}