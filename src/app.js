import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useFetch } from 'use-http'

import {
    Switch,
    Route,
    Redirect,
    BrowserRouter
} from "react-router-dom"

import NavBar from './containers/navbar'

import LoginPage from './pages/login'
import LoadingPage from './pages/loading'
import ProjectsPage from './pages/projects'
import BrowserPage from './pages/browser'
import ManagerPage from './pages/manager'
import ExplorerPage from './pages/explorer'
import APIDocsPage from './pages/doc/api'
import Error from './pages/error'


const Profile = () => {
    return (
        <main className="center">
            Profile page
        </main>
    )
}


const App = () => {
    const user = useSelector(state=>({...state.userReducer} ))
    const dispatch = useDispatch()

    const { loading, data } = useFetch('/api/users/me', [])

    useEffect(() => {
        if (data){
            dispatch({
                type: 'LOGIN',
                user: data
            })
        } 
    }, [data, dispatch])


    if (loading)
        return <LoadingPage/>

    if (!user.name)
        return <LoginPage />

    if (window.location.pathname.startsWith("/login/")){
        // already logged in, but stuck on the login page
        window.location.href = "/"
        return <LoadingPage/>
    }



    // TBD: at some moment, loading last project seemed to be a good idea,
    // but it's weird, so we'll just use the projects page    

    let homeScreen = "/projects"
    // const currentProject = window.localStorage.getItem('currentProject')
    // if (currentProject)
    //     homeScreen = `/browser/${currentProject}`
    

    return (
        <BrowserRouter>
            <NavBar/>
            <Switch>
                <Route path="/" exact><Redirect to={homeScreen}/></Route>
                <Route path="/projects" exact component={ProjectsPage}/>
                <Route path="/browser/:projectName" exact component={BrowserPage}/>
                <Route path="/manager/:projectName" exact component={ManagerPage}/>

                <Route path="/explorer" component={ExplorerPage} />
                <Route path="/doc/api" component={APIDocsPage} />
                <Route path="/profile" component={Profile} />

                <Route component={() => <Error code="404"/>}/>
            </Switch>
        </BrowserRouter>
    )
}


export default App