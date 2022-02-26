import ProjectWrapper from '../../containers/project-wrapper'
import Hierarchy from './hierarchy'
import Subsets from './subsets'
import Detail from './detail'
import Breadcrumbs from './breadcrumbs'

import {Splitter, SplitterPanel} from 'primereact/splitter'


const BrowserPage = () => {
    return (
        <ProjectWrapper>
            <main className="rows">
                <Breadcrumbs />

                <Splitter 
                    orientation="horizontal" 
                    stateKey={"browserSplitter"} 
                    stateStorage={"local"}
                    style={{width: '100%', height: '100%'}}
                >
                    <SplitterPanel size={20} style={{minWidth:250}}>
                        <Hierarchy/>
                    </SplitterPanel>
                    <SplitterPanel size={60} style={{minWidth:500}}>
                        <Subsets />
                    </SplitterPanel>
                    <SplitterPanel size={20}>
                        <Detail/>
                    </SplitterPanel>
                </Splitter>
            </main>
        </ProjectWrapper>
    )
}

export default BrowserPage