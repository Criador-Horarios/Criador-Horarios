import React, { useContext, useState } from 'react'
import styles from './NewTimetable.module.scss'
import i18next from 'i18next'
import AppCtx from '../../state/context'
import { faPaypal } from '@fortawesome/free-brands-svg-icons'
import GitHubIcon from '@material-ui/icons/GitHub'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Icon, CardContent, Box, Typography, Tooltip, FormControlLabel, ListItemIcon, ListItemText, Button, DialogTitle, DialogContent, DialogActions, Link, IconButton, Avatar, Dialog, AppBar, Toolbar } from '@material-ui/core'
import { Switch } from 'react-router'
import SavedStateHandler from '../../utils/saved-state-handler'

const Footer = () => {
	// TODO: Missing states
	const appContext = useContext(AppCtx)
	const classes = appContext.ui.classes

	// States
	const [classesDialog, setClassesDialog] = useState(false)
	const [newDomainDialog, setNewDomainDialog] = useState(false)
	const [changelogDialog, setChangelogDialog] = useState(false)
	const [warningDialog, setWarningDialog] = useState<{
			enabled: boolean, title?: string, content?: string, continue?: () => void,
				}>({
					enabled: false, title: '', content: '', continue: () => { return }
				})

	// Helpers
	const classesByShift = () => { return [] }
	const getMinimalClasses = () => { return [] }
	const newDomainURL = ''

	// Render
	return (
		<React.Fragment>
			<div className="footer">
				<AppBar color="default" className={classes.footer as string}>
					<Toolbar>
						<Tooltip title={i18next.t('footer.support-button.tooltip') as string}>
							<Link href="https://paypal.me/DanielG5?locale.x=pt_PT" target="_blank" onClick={() => { return } } color="inherit">
								<Button color='default' variant='outlined'
									startIcon={<FontAwesomeIcon icon={faPaypal}/>}
									size='small'
								>{i18next.t('footer.support-button.content') as string}
								</Button>
							</Link>
						</Tooltip>
						<Tooltip title={i18next.t('footer.changelog-button.tooltip') as string} style={{marginLeft: '8px'}}>
							<Button color='default' variant='outlined'
								startIcon={<Icon>new_releases</Icon>}
								size='small'
								onClick={() => { setChangelogDialog(true) }}
							>{i18next.t('footer.changelog-button.content') as string}
							</Button>
						</Tooltip>
						<div className={classes.grow as string} />
						<Tooltip title={i18next.t('footer.repository.tooltip') as string}>
							<Link href="https://github.com/joaocmd/Criador-Horarios" target="_blank" onClick={() => { return } } color="inherit">
								<IconButton color="inherit" onClick={() => { return }}>
									<GitHubIcon></GitHubIcon>
								</IconButton>
							</Link>
						</Tooltip>
						<Tooltip title="João David">
							<Link href="https://github.com/joaocmd" target="_blank" onClick={() => {return}} color="inherit">
								<IconButton title="João David" onClick={() => {return}}>
									<Avatar src={`${process.env.PUBLIC_URL}/img/joao.png`} />
								</IconButton>
							</Link>
						</Tooltip>
						<Tooltip title="Daniel Gonçalves">
							<Link href="https://dang.pt" target="_blank" onClick={() => {return}} color="inherit">
								<IconButton title="Daniel Gonçalves" onClick={() => {return}}>
									<Avatar src={`${process.env.PUBLIC_URL}/img/daniel.png`} />
								</IconButton>
							</Link>
						</Tooltip>
					</Toolbar>
				</AppBar>
			</div>
			<div className="dialogs">
				<Dialog fullWidth maxWidth="sm" open={classesDialog}>
					<DialogTitle>{i18next.t('classes-dialog.title') as string}</DialogTitle>
					<DialogContent className={classes.contentCopyable as string}>
						<Box>{
							classesByShift().map(c => {
								return (
									<div key={c[0]}>
										<Typography key={'course-' + c[0]} variant='h6'>{c[0]}: </Typography>
										<Typography key={'class-' + c[0]} variant='body1'
											style={{marginLeft: '8px'}}
										>{c[1]}</Typography>
									</div>
								)})
						}
						</Box>
						<br/>
						<Typography variant='h6'>{i18next.t('classes-dialog.minimal-classes')}: {getMinimalClasses().join(', ')}</Typography>
					</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => setClassesDialog(false)} color="primary">
							{i18next.t('classes-dialog.actions.close-button') as string}
						</Button>
					</DialogActions>
				</Dialog>
				<Dialog open={warningDialog.enabled}>
					<DialogTitle>{warningDialog.title}</DialogTitle>
					<DialogContent style={{whiteSpace: 'pre-line'}}>{warningDialog.content}</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => { warningDialog.continue?.call(this); setWarningDialog({ enabled: false })}}
							color="primary"
						>
							{i18next.t('warning.actions.continue') as string}
						</Button>
						{/* <Button onClick={() => {this.setState({warningDialog: false})}} color="primary">{i18next.t('warning.actions.back') as string}</Button> */}
					</DialogActions>
				</Dialog>
				<Dialog open={newDomainDialog}>
					<DialogTitle style={{alignSelf: 'center'}}>
						{i18next.t('new-domain.title', {domain: SavedStateHandler.DOMAIN?.replaceAll('https://', '')})}
					</DialogTitle>
					<DialogContent style={{display: 'flex', flexDirection: 'column'}}>
						<Box style={{whiteSpace: 'pre-line', alignSelf: 'center'}}>
							{(i18next.t('new-domain.content', {returnObjects: true, domain: SavedStateHandler.DOMAIN?.replaceAll('https://', '')}) as string[]).join('\n\n')}
						</Box>
						<br/>
						<Button variant='contained' style={{alignSelf: 'center'}} href={newDomainURL} color="primary">
							{i18next.t('new-domain.actions.access') as string}
						</Button>
					</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => {setNewDomainDialog(false)}} color="primary">
							{i18next.t('new-domain.actions.ignore') as string}
						</Button>
					</DialogActions>
				</Dialog>
				<Dialog open={changelogDialog}>
					<DialogTitle>{i18next.t('changelog-dialog.title') as string}</DialogTitle>
					<DialogContent style={{whiteSpace: 'pre-line'}}>{(i18next.t('changelog-dialog.content', {returnObjects: true}) as string[]).join('\n\n')}</DialogContent>
					<DialogActions>
						<div />
						<Button onClick={() => setChangelogDialog(false)} color="primary">{i18next.t('changelog-dialog.actions.back') as string}</Button>
					</DialogActions>
				</Dialog>
				{/* TODO: Implement */}
				{/* <Dialog open={this.state.confirmDeleteTimetable[0]}>
					<DialogTitle>{i18next.t('confirm-delete-timetable-dialog.title')}</DialogTitle>
					<DialogContent style={{whiteSpace: 'pre-line'}}>
						{i18next.t('confirm-delete-timetable-dialog.content', {timetable: this.state.confirmDeleteTimetable[1]?.name})}
					</DialogContent>
					<DialogActions>
						<Button onClick={() => this.setState({confirmDeleteTimetable: [false, this.state.confirmDeleteTimetable[1]]})}
							color="primary">
							{i18next.t('confirm-delete-timetable-dialog.actions.cancel')}
						</Button>
						<div />
						<Button color="secondary"
							onClick={() => {
								const prevTimetables = appContext.static.savedStateHandler.getCurrentTimetables()
								// Delete the timetable!
								const newTimetables = prevTimetables.filter((t) => t !== this.state.confirmDeleteTimetable[1])
								appContext.static.savedStateHandler.setSavedTimetables(newTimetables)
								this.setState({confirmDeleteTimetable: [false, this.state.confirmDeleteTimetable[1]]})
								this.updateToNewTimetable(newTimetables[0])
							}}>
							{i18next.t('confirm-delete-timetable-dialog.actions.confirm')}
						</Button>
					</DialogActions>
				</Dialog> */}
				{/* TODO: Move this to the page */}
				{/* <ColorPicker ref={refColorPicker} onUpdatedColor={(course: Course) => {
					appContext.savedTimetable.shiftState.availableShifts.forEach(shift => {
						if (shift.courseId === course.id) {
							shift.updateColorFromCourse()
							appContext.savedStateHandler.setCoursesColor([course])
						}
					})
					this.setState({ availableShifts: appContext.savedTimetable.shiftState.availableShifts })
				}}/>
				<NewTimetable ref={refNewTimetable}
					onCreatedTimetable={(newTimetable) => onSelectedTimetable(newTimetable)}
					onCancel={() =>
						refTopBar.current?.onSelectedAcademicTerm(appContext.savedTimetable.getAcademicTerm(), false)}
				/> */}
			</div>
		</React.Fragment>
	)
}

export default Footer