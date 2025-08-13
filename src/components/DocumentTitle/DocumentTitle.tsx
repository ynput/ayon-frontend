import {Helmet} from "react-helmet";
type DocumentProps = {
    title: string,
}

const DocumentTitle = ({title}: DocumentProps) => {

    return (<Helmet defer={false}>
            <title>{title}</title>
        </Helmet>
    )
}


export default DocumentTitle
