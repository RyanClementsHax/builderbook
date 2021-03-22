import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Head from 'next/head'
import NProgress from 'nprogress'
import * as React from 'react'

import Layout from '../components/layout'

import { getUserBySlugApiMethod, updateProfileApiMethod } from '../lib/api/public'

import notify from '../lib/notify'

type Props = {
  isMobile: boolean
  user: { email: string; displayName: string; slug: string; avatarUrl: string }
}

type State = { newName: string; newAvatarUrl: string; disabled: boolean }

class YourSettings extends React.Component<Props, State> {
  public static async getInitialProps() {
    const slug = 'asdf'

    const user = await getUserBySlugApiMethod(slug)

    console.log(user)

    return { ...user }
  }

  constructor(props) {
    super(props)

    this.state = {
      newName: this.props.user.displayName,
      newAvatarUrl: this.props.user.avatarUrl,
      disabled: false,
    }
  }

  public render() {
    const { user } = this.props
    const { newName, newAvatarUrl } = this.state

    return (
      <Layout {...this.props}>
        <Head>
          <title>Your Settings at Async</title>
          <meta name="description" content="description" />
        </Head>
        <div
          style={{
            padding: this.props.isMobile ? '0px' : '0px 30px',
            fontSize: '15px',
            height: '100%',
          }}
        >
          <h3>Your Settings</h3>
          <h4 style={{ marginTop: '40px' }}>Your account</h4>
          <ul>
            <li>
              Your email: <b>{user.email}</b>
            </li>
            <li>
              Your name: <b>{user.displayName}</b>
            </li>
          </ul>
          <form onSubmit={this.onSubmit} autoComplete="off">
            <h4>Your name</h4>
            <TextField
              autoComplete="off"
              value={newName}
              helperText="Your name as seen by your team members"
              onChange={(event) => {
                this.setState({ newName: event.target.value })
              }}
            />
            <br />
            <br />
            <Button variant="outlined" color="primary" type="submit" disabled={this.state.disabled}>
              Update name
            </Button>
          </form>

          <br />
          <h4>Your photo</h4>
          <Avatar
            src={newAvatarUrl}
            style={{
              display: 'inline-flex',
              verticalAlign: 'middle',
              marginRight: 20,
              width: 60,
              height: 60,
            }}
          />
          <label htmlFor="upload-file">
            <Button
              variant="outlined"
              color="primary"
              component="span"
              disabled={this.state.disabled}
            >
              Update avatar
            </Button>
          </label>
          <input
            accept="image/*"
            name="upload-file"
            id="upload-file"
            type="file"
            style={{ display: 'none' }}
          />
          <p />
          <br />
        </div>
      </Layout>
    )
  }

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const { newName, newAvatarUrl } = this.state

    console.log(newName)

    if (!newName) {
      notify('Name is required')
      return
    }

    NProgress.start()
    this.setState({ disabled: true })

    try {
      await updateProfileApiMethod({
        name: newName,
        avatarUrl: newAvatarUrl,
      })

      notify('You successfully updated your profile.')
    } catch (error) {
      notify(error)
    } finally {
      this.setState({ disabled: false })
      NProgress.done()
    }
  }
}

export default YourSettings
