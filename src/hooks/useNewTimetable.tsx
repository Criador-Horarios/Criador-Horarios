import { useCallback, useState } from 'react'
import AcademicTerm from '../domain/AcademicTerm'
import Timetable from '../domain/Timetable'

import { staticData } from '../utils/api'

interface NewTimetableHook {
	openNewTimetable: (academicTerm: AcademicTerm) => void
	openAfterChangeAcademicTerm: (academicTerm: AcademicTerm) => void
	openDuplicateTimetable: (timetable: Timetable) => void
	newTimetableProps: {
		open: boolean,
		onClose: () => void,
		showChangedAcademicTermWarning: boolean,
		academicTerm: AcademicTerm | undefined,
		oldTimetable: Timetable | undefined,
	}
}

function useNewTimetable () : NewTimetableHook {
	const [dialogOpen, setDialogOpen] = useState(false)
	const [academicTerm, setAcademicTerm] = useState<AcademicTerm | undefined>()
	const [showChangedAcademicTermWarning, setShowChangedAcademicTermWarning] = useState(false)
	const [oldTimetable, setOldTimetable] = useState<Timetable | undefined>()
	
	const openNewTimetable = useCallback((academicTerm: AcademicTerm) => {
		setDialogOpen(true)
		setAcademicTerm(academicTerm)
		setShowChangedAcademicTermWarning(false)
		setOldTimetable(undefined)
	}, [setDialogOpen, setAcademicTerm, setShowChangedAcademicTermWarning, setOldTimetable])

	const openAfterChangeAcademicTerm = useCallback((academicTerm: AcademicTerm) => {
		openNewTimetable(academicTerm)
		setShowChangedAcademicTermWarning(true)
	}, [openNewTimetable, setShowChangedAcademicTermWarning])

	const openDuplicateTimetable = useCallback((timetable: Timetable) => {
		const academicTerm = staticData.terms.find(term => term.id === timetable.getAcademicTerm()) || staticData.currentTerm as AcademicTerm
		openNewTimetable(academicTerm)
		setOldTimetable(timetable)
	}, [openNewTimetable, setShowChangedAcademicTermWarning])

	const onClose = useCallback(() => setDialogOpen(false), [setDialogOpen])

	return {
		openNewTimetable,
		openAfterChangeAcademicTerm,
		openDuplicateTimetable,
		newTimetableProps: {
			open: dialogOpen,
			onClose,
			showChangedAcademicTermWarning,
			academicTerm,
			oldTimetable,
		}
	}
}

export default useNewTimetable