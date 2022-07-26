import { Dialog } from 'primereact/dialog'
import { Spacer, Button } from '../components'

const NewUserDialog = ({visible, onHide}) => {
  const [userType, setUserType] = useState("user")

  return (
    <Dialog header="New user">
      <div style={{flexDirection: "column"}}>

      

      </div>
    </Dialog>
  )
}

export default NewUserDialog
