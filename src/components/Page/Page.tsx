import React, { useContext } from 'react'
import styles from './Page.module.scss'
import i18next from 'i18next'
import AppCtx from '../../state/context'
import { Card, CardActions, CardContent, CardHeader, withStyles } from '@material-ui/core'
import { ToggleButtonGroup } from '@material-ui/lab'

const Page = () => {
	// TODO: Missing states
	const appContext = useContext(AppCtx)
	const classes = appContext.ui.classes
	const theme = appContext.ui.theme

	// Render
	const StyledToggleButtonGroup = withStyles((theme) => ({
		grouped: {
			margin: theme.spacing(0.5),
			border: 'none',
			'&:not(:first-child)': {
				borderRadius: theme.shape.borderRadius,
			},
			'&:first-child': {
				borderRadius: theme.shape.borderRadius,
			},
		}
	}))(ToggleButtonGroup)

	return (
		<React.Fragment>
			<div className="main">
				{/* <Snackbar
					open={appContext.ui.alert.enabled}
					autoHideDuration={3000}
					onClose={handleCloseAlert}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
					<Alert
						action={<IconButton size='small' onClick={handleCloseAlert}><Icon>close</Icon></IconButton>}
						severity={alert.severity || 'info'}>
						{alert.message}
					</Alert>
				</Snackbar> */}
				<div className={classes.body as string}>
					<div className="schedules">
						<Card className={classes.card as string}>
							<CardHeader title={i18next.t('schedule-available.title') as string}
								// titleTypographyProps={{ variant: 'h6', align: 'center' }}
								className={classes.cardTitle as string}
							/>
							<CardContent className={classes.cardContent as string}>
								{/* TODO: Add schedule */}
								{/* <Schedule
									onSelectedEvent={(id: string) =>
										appContext.actions.onSelectedShift(id, appContext.savedTimetable.shiftState.availableShifts)}
									events={getAllLessons()} lang={appContext.lang}
									darkMode={appContext.darkMode}
								/> */}
							</CardContent>
							<CardActions>
								{/* <Paper elevation={0} className={`${classes.paper as string} ${classes.centered as string}`}
									style={{ border: `1px solid ${theme.palette.divider}` }}
								>
									<StyledToggleButtonGroup
										className={classes.toggleGroup as string}
										size="small"
										value={selectedCampi}
										onChange={(_, value) => changeCampi(value as string[])}
										aria-label="text alignment"
									>
										{campiList.map((name: string) => (
											<ToggleButton key={name} value={name}>{name}</ToggleButton>
										))}
									</StyledToggleButtonGroup>
									<Divider flexItem orientation="vertical" className={classes.divider as string}/>
									<StyledToggleButtonGroup
										className={classes.toggleGroup as string}
										size="small"
										value={selectedShiftTypes}
										onChange={(_, value) => changeShiftTypes(value as string[])}
									>
										{Object.entries(ShiftType).map((name) => (
											<ToggleButton key={name[1]} value={name[1]}>{name[0]}</ToggleButton>
										))}
									</StyledToggleButtonGroup>
								</Paper> */}
							</CardActions>
						</Card>
						<Card className={classes.card as string}>
							{/* <CardHeader //title={i18next.t('schedule-selected.title') as string}
								titleTypographyProps={{ variant: 'h6', align: 'center' }}
								className={classes.cardTitle as string}
								title={
									<Box style={{flexDirection: 'row', display: 'flex'}}>
										<span style={{flexGrow: 1, width: '23%'}}></span>
										<Typography variant='h6' align='center' style={{flexGrow: 1}}>{i18next.t('schedule-selected.title')}</Typography>
										<Autocomplete disableClearable autoHighlight size='small'
											filterOptions={(options, params): (Timetable | string)[] => {
												const filter = createFilterOptions<Timetable | string>()
												const filtered = filter(options, params)
												filtered.unshift(i18next.t('timetable-autocomplete.add-new'))
								
												const { inputValue } = params
												// Suggest the creation of a new value
												const isExisting = options.some((option) => typeof option === 'string' || inputValue === option.name)
												if (inputValue !== '' && !isExisting) {
													filtered.push(new Timetable(inputValue, [], false, false, appContext.currentAcademicTerm))
												}
								
												return filtered
											}}
											options={shownTimetables as (Timetable | string)[]}
											value={appContext.savedTimetable}
											onChange={(_, value) => onSelectedTimetable(value)}
											getOptionLabel={(option) => typeof option === 'string' ? i18next.t('timetable-autocomplete.add-new') : option.getDisplayName()}
											renderInput={(params) => <TextField {...params} variant="standard" />}
											renderOption={(option) =>
												<Tooltip title={typeof option === 'string' ? '' : option.getAcademicTerm()} placement="bottom">
													<div style={{display: 'flex', flexDirection: 'row', width: '100%'}}>
														{typeof option === 'string' &&
															<IconButton color="inherit" component="span" size="small" style={{marginLeft: '-8px'}}>
																<Icon>add</Icon>
															</IconButton>
														}															
														<Typography style={{flexGrow: 1, overflow: 'clip', marginTop: '4px'}}>
															{typeof option === 'string' ? i18next.t('timetable-autocomplete.add-new') : option.getDisplayName()}
														</Typography>
														{this.state.shownTimetables.length > 1 && typeof option !== 'string' &&
															<IconButton color="inherit" component="span" size="small"
																disabled={this.state.shownTimetables.length <= 1}
																onClick={() => this.setState({confirmDeleteTimetable: [true, option]})}
															>
																<Icon>delete</Icon>
															</IconButton>
														}
													</div>
												</Tooltip>
											}
											style={{width: '23%', flexGrow: 1}}
										/>
									</Box>
								}
							/> */}
							<CardContent className={classes.cardContent as string}>
								{/* <Schedule
									onSelectedEvent={(id: string) => onSelectedShift(id, appContext.savedTimetable.shiftState.selectedShifts)}
									events={getSelectedLessons()} ref={refChosenSchedule} lang={appContext.lang}
									darkMode={appContext.darkMode}
								/> */}
							</CardContent>
							{/* <CardActions>
								<div style={{display: 'flex', flexGrow: 1, flexWrap: 'wrap'}}>
									{this.getCoursesBySelectedShifts().map(([c, types]) => (
										<Paper elevation={0} variant={'outlined'} key={c.hashString()}
											style={{padding: '4px', margin: '4px', display: 'flex'}}
										>
											<Tooltip title={i18next.t('color-picker-dialog.title', { course: c.acronym}) as string}
												key={c.hashString()}>
												<Chip size="small" color='primary'
													style={{backgroundColor: c.color}}
													label={<span style={{color: c.textColor}}>{c.acronym}</span>}
													onClick={() => this.colorPicker.current?.show(c)} // Toggle colorPicker on click
												/>
											</Tooltip>
											{ Array.from(c.shiftTypes.entries()).map(([type]) => {
												const shown = types[type as ShiftType] !== undefined
												return (
													<Paper elevation={0} key={type}
														className={ (shown ? classes.checklistSelected : classes.checklistUnselected) as string }
														style={{
															marginLeft: '4px', marginRight: '4px',
															color: `${shown ? this.theme.palette.text.primary : this.theme.palette.text.hint}`
														}}
													>
														<Typography variant='body1' style={{ fontWeight: 500 }}>{type}</Typography>
													</Paper>
												)
											})}
										</Paper>
									))}
								</div>
								<div className={classes.centered as string}>
									<Tooltip title={i18next.t('multishiftmode-switch') as string}>
										<FormControlLabel
											className={classes.formLabel as string}
											label={<AllInclusiveIcon fontSize="small" />}
											labelPlacement="top"
											control={
												<Switch
													checked={appContext.savedTimetable.isMultiShift}
													disabled={this.state.inhibitMultiShiftModeChange}
													onChange={this.onChangeMultiShiftMode}
													size="small"
												/>
											}
										/>
									</Tooltip>
									<Tooltip title={i18next.t('schedule-selected.actions.get-classes') as string}>
										<IconButton
											disabled={appContext.savedTimetable.shiftState.selectedShifts.length === 0}
											color="inherit"
											onClick={() => getClasses()}
											component="span">
											<Icon>list</Icon>
										</IconButton>
									</Tooltip>
									<Tooltip title={i18next.t('link-button.tooltip') as string}>
										<IconButton disabled={appContext.savedTimetable.shiftState.selectedShifts.length === 0} color="inherit" onClick={this.getLink} component="span">
											<Icon>share</Icon>
										</IconButton>
									</Tooltip>
									<Tooltip title={i18next.t('schedule-selected.actions.save-to-file') as string}>
										<IconButton
											disabled={appContext.savedTimetable.shiftState.selectedShifts.length === 0}
											color="inherit"
											onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {this.onSaveMenuClick(e, true)}}
											component="span">
											<Icon>download</Icon>
										</IconButton>
									</Tooltip>
									<Menu anchorEl={this.state.saveMenuAnchor} open={Boolean(this.state.saveMenuAnchor)} keepMounted
										onClose={() => {this.onSaveMenuClick(null, false)}}
										anchorOrigin={{vertical:'top', horizontal:'center'}}
										transformOrigin={{vertical:'bottom', horizontal:'center'}}
									>
										<MenuItem onClick={() => {this.onSaveMenuClick(null, false); this.exportToExcel()}}
											disableRipple>
											<ListItemIcon style={{marginLeft: '4px'}}>
												<FontAwesomeIcon size='lg' icon={faFileExcel}/>
											</ListItemIcon>
											<ListItemText style={{marginLeft: '-4px'}}>{i18next.t('schedule-selected.actions.save-as-excel')}</ListItemText>
										</MenuItem>
										<MenuItem onClick={() => {this.onSaveMenuClick(null, false); this.saveSchedule()}}
											disableRipple>
											<ListItemIcon>
												<Icon>image</Icon>
											</ListItemIcon>
											<ListItemText>{i18next.t('schedule-selected.actions.save-as-image')}</ListItemText>
										</MenuItem>
										<MenuItem onClick={() => {this.onSaveMenuClick(null, false); this.downloadCalendar()}}
											disableRipple>
											<ListItemIcon>
												<Icon>event</Icon>
											</ListItemIcon>
											<ListItemText>{i18next.t('schedule-selected.actions.get-calendar')}</ListItemText>
										</MenuItem>
									</Menu>
									<Tooltip title={i18next.t('schedule-selected.actions.duplicate-timetable') as string}>
										<IconButton
											disabled={appContext.savedTimetable.shiftState.selectedShifts.length === 0}
											color="inherit"
											onClick={() =>
												refNewTimetable.current?.show(staticData.currentTerm || staticData.terms[0], false, this.state.savedTimetable)
											}
											component="span">
											<FontAwesomeIcon icon={faClone}/>
										</IconButton>
									</Tooltip>
								</div>
							</CardActions> */}
						</Card>
					</div>
				</div>
			</div>
		</React.Fragment>
	)
}

export default Page