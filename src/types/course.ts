export type Course = {
	_id: string;
	title: string;
	description: string;
	thumbnail?: string;
	instructor?: string;
};

export type Pagination = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};

export type Module = {
	_id: string;
	title: string;
	description?: string;
	order?: number;
	updated?: string;
	course?: {
		_id: string;
		title: string;
	};
};

export type Lesson = {
	_id: string;
	title: string;
	description?: string;
	videoUrl?: string;
	duration?: number;
	order?: number;
	course?: {
		_id: string;
		title: string;
	};
	module?: {
		_id: string;
		title: string;
	};
	added?: string;
	updated?: string;
	completed?: boolean;
};

export type LearningLesson = {
	_id: string;
	title: string;
	completed: boolean;
};

export type LearningModule = {
	_id: string;
	title: string;
	description?: string;
	lessons: LearningLesson[];
};

type Progress = {
	totalLessons: number;
	completedLessons: number;
	percentage: number;
};

export type EnrollmentCourseDetails = {
	_id: string;
	title: string;
	description: string;
	thumbnail?: string;
	status?: "published";
	updatedAt?: string;
	instructor: string;
	enrolledAt?: string;
	modules: LearningModule[];
	progress?: Progress;
};
