export interface ReviewParticipationDto {
  phaseId: string;
  score: number;
  message?: string;
  notifyParticipant?: boolean;
}
