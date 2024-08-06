import { ReviewBlockCheckService } from './review-block-check.service';
import { ReviewBookmarkCheckService } from './review-bookmark-check.service';
import { ReviewLikeService } from './review-like.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Exception } from 'src/decorator/exception.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewEntity } from './entity/Review.entity';
import { UploadReviewImageResponseDto } from './dto/response/upload-review-image-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './review.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { LoginUser } from 'src/auth/model/login-user.model';
import { GetUser } from 'src/auth/get-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import { ReviewSearchResponseDto } from './dto/response/review-search-response.dto';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';
import { ReviewPagerbleResponseDto } from './dto/response/review-pagerble-response.dto';
import { ReviewLikeCheckService } from './review-like-check.service';
import { ReviewBookmarkService } from './review-bookmark.service';

@Controller('')
@ApiTags('review')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly reviewLikeService: ReviewLikeService,
    private readonly reviewLikeCheckService: ReviewLikeCheckService,
    private readonly reviewBookmarkService: ReviewBookmarkService,
    private readonly reviewBookmarkCheckService: ReviewBookmarkCheckService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('/review/all')
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: '최신 리뷰목록보기' })
  @ApiQuery({ name: 'size', description: '한 페이지에 담긴 리뷰수' })
  @ApiQuery({ name: 'page', description: '페이지' })
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 200, type: ReviewEntity, isArray: true })
  async getReviewAll(
    @GetUser() loginUser: LoginUser,
    @Query('page') page: number,
    @Query('size') size: number,
  ): Promise<ReviewPagerbleResponseDto> {
    if (!loginUser) {
      console.log('비로그인유저');
      return await this.reviewService.getLatestReview({
        size: size || 10,
        page: page || 1,
      });
    }

    //사용자 좋아요 여부, 북마크 여부, 공유여부도 반환해야함
    console.log('로그인유저');
    const reviewPagerbleResponseDto = await this.reviewService.getLatestReview({
      size: size || 10,
      page: page || 1,
    });

    await this.reviewLikeCheckService.isReviewLiked(
      loginUser.idx,
      reviewPagerbleResponseDto.reviews,
    );

    await this.reviewBookmarkCheckService.isReviewBookmarked(
      loginUser.idx,
      reviewPagerbleResponseDto.reviews,
    );

    return reviewPagerbleResponseDto;
  }

  @Get('/review/popular')
  @ApiOperation({ summary: '인기 리뷰목록보기' })
  @ApiResponse({ status: 200, type: ReviewEntity, isArray: true })
  async getReviewPopular() {
    console.log('api시작');
  }

  @Post('/review')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '리뷰 작성하기' })
  @ApiBearerAuth()
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한 없음')
  @Exception(500, '서버 에러')
  @ApiResponse({
    status: 201,
    type: ReviewEntity,
    description: '리뷰작성 성공시 201 반환',
  })
  async createReview(
    @GetUser() loginUser: LoginUser,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewEntity> {
    return await this.reviewService.createReview(loginUser, createReviewDto);
  }

  //멀터생성하기
  //멀터 정리하기
  @Post('/review/img')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '리뷰 이미지업로드' })
  @ApiBearerAuth()
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한없음')
  @Exception(500, '서버 에러')
  @ApiResponse({
    status: 201,
    description: '리뷰 이미지 업로드 성공시 201반환',
    type: UploadReviewImageResponseDto,
  })
  async uploadReviewImage(): Promise<{ imgPath: string }> {
    return;
  }

  //getReview생성하기
  @Get('/review/:reviewIdx')
  @ApiOperation({ summary: '리뷰 자세히보기' })
  @ApiParam({ name: 'reviewIdx', example: 1 })
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한 없음')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 200, type: ReviewEntity })
  async getReviewIdx() {}

  @Put('/review/:reviewIdx')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '리뷰 수정하기' })
  @ApiBearerAuth()
  @ApiParam({ name: 'reviewIdx', example: 1 })
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한 없음')
  @Exception(404, '해당 리소스 없음')
  @Exception(500, '서버에러')
  @ApiResponse({ status: 200 })
  async updateReview(
    @GetUser() loginUser: LoginUser,
    @Param('reviewIdx') reviewIdx: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewEntity> {
    //작업 시작해야할 부분
    const review = await this.reviewService.updateReview(
      loginUser,
      reviewIdx,
      updateReviewDto,
    );
    return review;
  }

  @Delete('/review/:reviewIdx')
  @ApiOperation({ summary: '리뷰 삭제하기' })
  @ApiBearerAuth()
  @ApiParam({ name: 'reviewIdx', example: 3 })
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한 없음')
  @Exception(404, '해당 리소스 없음')
  @Exception(500, '서버에러')
  @ApiResponse({ status: 200 })
  async deleteReview(
    @GetUser() loginUser: LoginUser,
    @Param('reviewIdx') reviewIdx: number,
  ): Promise<ReviewEntity> {
    console.log('실행되면안되는api');
    const reviewEntity = await this.reviewService.deleteReview(
      loginUser,
      reviewIdx,
    );
    return reviewEntity;
  }

  @Get('/review')
  @ApiOperation({ summary: '리뷰검색하기 닉네임, 태그, 제목,내용' })
  @ApiQuery({ name: 'search', description: '검색 키워드' })
  @Exception(404, 'Not Found Page')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 200, type: ReviewSearchResponseDto })
  async getReviewWithSearch(
    @Query('search') search: string,
    @Query('page') page: number,
    @Query('size') size: number,
  ): Promise<ReviewSearchResponseDto> {
    console.log('api시작');

    return await this.reviewService.getReviewWithSearch({
      search: search,
      size: size || 2,
      sort: 'asc',
      page: page || 1,
    });
  }

  @Post('/review/:reviewIdx/bookmark')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '리뷰 북마크하기' })
  @ApiParam({ name: 'reviewIdx', example: 1 })
  @ApiBearerAuth()
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한 없음')
  @Exception(404, '해당 리소스 찾을수 없음')
  @Exception(409, '현재상태와 요청 충돌')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 201 })
  async bookmarkReview(
    @GetUser() loginUser: LoginUser,
    @Param('reviewIdx') reviewIdx: number,
  ) {
    await this.reviewBookmarkService.bookmarkReview(loginUser.idx, reviewIdx);
  }

  @Delete('/review/:reviewIdx/bookmark')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '리뷰 북마크해제하기' })
  @ApiParam({ name: 'reviewIdx', example: 1 })
  @ApiBearerAuth()
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한 없음')
  @Exception(404, '해당 리소스 찾을수 없음')
  @Exception(409, '현재상태와 요청 충돌')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 201 })
  async unbookmarkReview(
    @GetUser() loginUser: LoginUser,
    @Param('reviewIdx') reviewIdx: number,
  ) {
    await this.reviewBookmarkService.unBookmarkReview(loginUser.idx, reviewIdx);
  }

  @Post('/review/:reviewIdx/like')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '리뷰 좋아요하기' })
  @ApiParam({ name: 'reviewIdx', example: 1 })
  @ApiBearerAuth()
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한 없음')
  @Exception(404, '해당 리소스 찾을수 없음')
  @Exception(409, '현재상태와 요청 충돌')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 201 })
  async likeReview(
    @GetUser() loginUser: LoginUser,
    @Param('reviewIdx') reviewIdx: number,
  ) {
    await this.reviewLikeService.likeReview(loginUser.idx, reviewIdx);
  }

  @Delete('/review/:reviewIdx/like')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: '리뷰 좋아요해제하기' })
  @ApiParam({ name: 'reviewIdx', example: 1 })
  @ApiBearerAuth()
  @Exception(400, '유효하지않은 요청')
  @Exception(401, '권한 없음')
  @Exception(404, '해당 리소스 찾을수 없음')
  @Exception(409, '현재상태와 요청 충돌')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 200 })
  async unlikeReview(
    @GetUser() loginUser: LoginUser,
    @Param('reviewIdx') reviewIdx: number,
  ) {
    await this.reviewLikeService.unlikeReview(loginUser.idx, reviewIdx);
  }

  @Get('/user/:userIdx/review/all')
  @ApiOperation({ summary: '유저가 쓴 리뷰목록보기' })
  @ApiParam({ name: 'userIdx', example: 1 })
  @Exception(400, '유효하지않은 요청')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 200, type: ReviewEntity, isArray: true })
  async getReviewAllByuserIdx() {}

  @Get('/user/:userIdx/review/bookmark')
  @ApiOperation({ summary: '유저의 북마크한 리뷰목록보기' })
  @ApiParam({ name: 'userIdx', example: 1 })
  @Exception(400, 'Invalid Request Query')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 200, type: ReviewEntity, isArray: true })
  async getBookmarkedReviewByuserIdx() {}

  @Get('/user/:userIdx/review/commented')
  @ApiOperation({ summary: '유저의 댓글단 리뷰목록보기' })
  @ApiParam({ name: 'userIdx', example: 1 })
  @Exception(400, 'Invalid Request Query')
  @Exception(500, '서버 에러')
  @ApiResponse({ status: 200, type: ReviewEntity, isArray: true })
  async getCommentAllByuserIdx() {}

  //리뷰신고하기
}
