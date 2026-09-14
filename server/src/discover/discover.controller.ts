import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { DiscoverService } from "./discover.service";

@ApiTags("discover")
@Controller("discover")
export class DiscoverController {
  constructor(private readonly discover: DiscoverService) {}

  @Public()
  @Get("hot-topics")
  hotTopics() {
    return this.discover.hotTopics();
  }

  @Public()
  @Get("recommended-authors")
  recommendedAuthors() {
    return this.discover.recommendedAuthors();
  }

  @Public()
  @Get("hot-tags")
  hotTags() {
    return this.discover.hotTags();
  }
}
