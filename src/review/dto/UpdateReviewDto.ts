import { ApiProperty } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiProperty({ example: 1, description: '리뷰idx' })
  reviewIdx: number;

  @ApiProperty({ example: '제목', description: '리뷰 제목' })
  title: string;

  @ApiProperty({ example: '내용', description: '리뷰 내용' })
  content: string;

  @ApiProperty({ example: 4.5, description: '별점 최대 5점' })
  score: number;
}
