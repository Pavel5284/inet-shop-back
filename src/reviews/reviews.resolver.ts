import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { GqlAuthGuard } from '../common/gql-auth.guard';
import { CreateReviewInput } from './dto/create-review.input';
import { Review } from './review.entity';
import { ReviewsService } from './reviews.service';

@Resolver(() => Review)
export class ReviewsResolver {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Query(() => [Review], { description: 'Отзывы о товаре (новые сверху)' })
  reviews(@Args('productId', { type: () => ID }) productId: string) {
    return this.reviewsService.list(productId);
  }

  @Mutation(() => Review)
  @UseGuards(GqlAuthGuard)
  createReview(@CurrentUser() user: AuthUser, @Args('input') input: CreateReviewInput) {
    return this.reviewsService.create(user.id, input);
  }
}
